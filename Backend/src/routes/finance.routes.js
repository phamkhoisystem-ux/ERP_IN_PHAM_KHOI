import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

const number = value => Number(value || 0);
const parseJson = value => typeof value === 'string' ? JSON.parse(value) : (value || {});
const periodSchema = z.object({ year: z.coerce.number().int().min(2000).max(2100), month: z.coerce.number().int().min(1).max(12) });

function mayReadFinance(req, res, next) {
  if (req.user.role === 'ADMIN' || req.user.role === 'ACCOUNTANT' || req.user.modules.includes('finance')) return next();
  return res.status(403).json({ message: 'Bạn chưa được cấp quyền xem Báo cáo tài chính.' });
}

function periodRange(year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(year, month, 1));
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

function loanMetrics(loans, year, month) {
  let laivay = 0, gocvay = 0, no_daihan = 0, tien_vay = 0;
  for (const loan of loans) {
    const start = loan.start_date ? new Date(`${String(loan.start_date).slice(0, 10)}T00:00:00`) : null;
    const principal = number(loan.principal_amount), term = Number(loan.term_months || 0), rate = number(loan.interest_rate) / 100 / 12;
    if (!start || !term || loan.status === 'CANCELLED') continue;
    if (start.getFullYear() === year && start.getMonth() + 1 === month) tien_vay += principal;
    let remaining = principal;
    for (let period = 1; period <= term; period += 1) {
      const due = new Date(start.getFullYear(), start.getMonth() + period, 1);
      const interest = loan.payment_method === 'reducing' ? remaining * rate : principal * rate;
      const principalPart = principal / term;
      if (due.getFullYear() === year && due.getMonth() + 1 === month) { laivay += interest; gocvay += principalPart; }
      if (due <= new Date(year, month, 0)) remaining -= principalPart;
    }
    no_daihan += Math.max(0, remaining);
  }
  return { laivay, gocvay, no_daihan, tien_vay };
}

router.get('/report', mayReadFinance, async (req, res, next) => {
  try {
    const { year, month } = periodSchema.parse(req.query);
    const { start, end } = periodRange(year, month);
    const [salesRows, walletRows, salaryRows, assetRows, loanRows, debtRows, paymentRows, inventoryRows, reportRows, historyRows] = await Promise.all([
      pool.execute("SELECT COALESCE(SUM(revenue_before_tax), 0) doanhthu, COALESCE(SUM(total_amount), 0) tien_thu, COALESCE(SUM(cost_amount), 0) giavon, COUNT(*) total FROM sales WHERE sale_date >= ? AND sale_date < ? AND status = 'COMPLETED'", [start, end]),
      pool.execute("SELECT COALESCE(SUM(CASE WHEN transaction_date < ? THEN CASE WHEN transaction_type = 'THU' THEN amount ELSE -amount END ELSE 0 END), 0) tien_dauky, COALESCE(SUM(CASE WHEN transaction_date >= ? AND transaction_date < ? AND transaction_type = 'CHI' AND category = 'Chi phí bán hàng' THEN amount ELSE 0 END), 0) cp_banhang, COALESCE(SUM(CASE WHEN transaction_date >= ? AND transaction_date < ? AND transaction_type = 'CHI' AND category = 'Chi phí vận hành' THEN amount ELSE 0 END), 0) cp_quanly FROM wallet_transactions", [start, start, end, start, end]),
      pool.execute('SELECT COALESCE(SUM(net_salary), 0) tien_luong FROM salary_payments WHERE pay_date >= ? AND pay_date < ?', [start, end]),
      pool.execute("SELECT purchase_price, purchase_date, depreciation_months FROM assets WHERE status = 'ACTIVE' AND purchase_date IS NOT NULL AND purchase_date < ?", [end]),
      pool.query("SELECT principal_amount, interest_rate, term_months, start_date, payment_method, status FROM loans WHERE status IN ('ACTIVE', 'PAID')"),
      pool.query("SELECT COALESCE(SUM(total_amount - paid_amount), 0) no_nganhan FROM supplier_debts WHERE status NOT IN ('PAID', 'CANCELLED')"),
      pool.execute('SELECT COALESCE(SUM(amount), 0) tien_tra_ncc FROM supplier_payments WHERE payment_date >= ? AND payment_date < ?', [start, end]),
      pool.query('SELECT COALESCE(SUM(quantity * unit_cost), 0) tonkho FROM finished_products'),
      pool.execute('SELECT report_data FROM financial_monthly_reports WHERE report_year = ? AND report_month = ? LIMIT 1', [year, month]),
      pool.query('SELECT report_year, report_month, report_data FROM financial_monthly_reports ORDER BY report_year DESC, report_month DESC LIMIT 120')
    ]);
    const sales = salesRows[0][0], wallet = walletRows[0][0], salary = salaryRows[0][0], debt = debtRows[0][0], payments = paymentRows[0][0], inventory = inventoryRows[0][0];
    let khauhao = 0, taisan_daihan = 0, tien_dautu = 0;
    for (const asset of assetRows[0]) {
      const bought = new Date(`${String(asset.purchase_date).slice(0, 10)}T00:00:00`);
      const months = Number(asset.depreciation_months || 0), price = number(asset.purchase_price);
      const elapsed = (year - bought.getFullYear()) * 12 + (month - (bought.getMonth() + 1)) + 1;
      if (bought >= new Date(start)) tien_dautu += price;
      if (months > 0 && elapsed >= 1) {
        const monthly = price / months;
        if (elapsed <= months) khauhao += monthly;
        taisan_daihan += Math.max(0, price - monthly * Math.min(elapsed, months));
      } else taisan_daihan += price;
    }
    const manualSource = reportRows[0][0] ? parseJson(reportRows[0][0].report_data) : {};
    const manual = { giamtru: number(manualSource.giamtru), phaithu: number(manualSource.phaithu) };
    const auto = {
      doanhthu: number(sales.doanhthu), tienThuVat: number(sales.tien_thu), giavon: number(sales.giavon),
      tien_luong: number(salary.tien_luong), tien_dauky: number(wallet.tien_dauky), cp_banhang: number(wallet.cp_banhang), cp_quanly: number(wallet.cp_quanly),
      khauhao, taisan_daihan, tien_dautu, no_nganhan: number(debt.no_nganhan), tonkho: number(inventory.tonkho),
      tien_tra_ncc: number(payments.tien_tra_ncc), ...loanMetrics(loanRows[0], year, month)
    };
    const history = historyRows[0].map(row => ({ ...parseJson(row.report_data), year: String(row.report_year), month: String(row.report_month).padStart(2, '0') }));
    res.json({ period: { year, month }, auto, manual, history, hasActivity: Number(sales.total) > 0 || Object.values(auto).some(value => number(value) !== 0) || Boolean(reportRows[0][0]) });
  } catch (error) { next(error); }
});

router.get('/trend', mayReadFinance, async (req, res, next) => {
  try {
    const { year } = z.object({ year: z.coerce.number().int().min(2000).max(2100) }).parse(req.query);
    const [salesRows, expenseRows, reportRows] = await Promise.all([
      pool.execute("SELECT MONTH(sale_date) month, COALESCE(SUM(revenue_before_tax), 0) doanhthu, COALESCE(SUM(cost_amount), 0) giavon FROM sales WHERE YEAR(sale_date) = ? AND status = 'COMPLETED' GROUP BY MONTH(sale_date)", [year]),
      pool.execute("SELECT MONTH(transaction_date) month, COALESCE(SUM(CASE WHEN category IN ('Chi phí bán hàng', 'Chi phí vận hành') AND transaction_type = 'CHI' THEN amount ELSE 0 END), 0) chiphi FROM wallet_transactions WHERE YEAR(transaction_date) = ? GROUP BY MONTH(transaction_date)", [year]),
      pool.execute('SELECT report_month, report_data FROM financial_monthly_reports WHERE report_year = ?', [year])
    ]);
    const salesByMonth = new Map(salesRows[0].map(row => [Number(row.month), row]));
    const expensesByMonth = new Map(expenseRows[0].map(row => [Number(row.month), number(row.chiphi)]));
    const reportsByMonth = new Map(reportRows[0].map(row => [Number(row.report_month), parseJson(row.report_data)]));
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1, sales = salesByMonth.get(month) || {}, report = reportsByMonth.get(month) || {};
      const doanhthu = number(sales.doanhthu) - number(report.giamtru);
      const loinhuan = doanhthu - number(sales.giavon) - number(expensesByMonth.get(month)) - number(report.khauhao) - number(report.laivay);
      return { month, doanhthu, loinhuan };
    });
    res.json({ year, months });
  } catch (error) { next(error); }
});

export default router;
