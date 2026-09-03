import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

// Public API names are intentionally decoupled from SQL table names. Every writable
// field is listed explicitly so callers cannot update password_hash, audit fields, etc.
const RESOURCES = {
  employees: { table: 'employees', permission: 'employees', fields: ['employee_code','name','date_of_birth','phone','start_date','end_date','position','level','employee_type','note','status','base_salary','kpi_revenue','kpi_percent','part_time_rate','part_time_hours','bonus','deduct','p3_c1','p3_c2','p3_c3','p3_c4'] },
  productionPlans: { table: 'production_plans', permission: 'plans', fields: ['plan_code','name','finished_product_id','finished_product_name','plan_type','plan_date','deadline','total_amount','is_hold','status','details_json','rollback_data_json','raw_data_json'] },
  productionPlanDetails: { table: 'production_plan_details', permission: 'plans', fields: ['production_plan_id','detail_type','supplier_id','description','quantity','unit','unit_price','vat_percent','total_amount','material_id','warehouse','extra_data'] },
  productionOrders: { table: 'production_orders', permission: 'orders', fields: ['production_plan_id','order_code','finished_product_id','finished_product_name','status','deadline','actual_quantity','note','extra_data'] },
  productionShiftLogs: { table: 'production_shift_logs', permission: 'production_logs', fields: ['log_code','production_order_id','order_code','work_date','shift_name','target_quantity','good_quantity','defect_quantity','worker_count','uptime_hours','downtime_hours','overtime_hours','raw_data'] },
  productionOrderMaterials: { table: 'production_order_materials', permission: 'orders', fields: ['production_order_id','material_id','quantity','unit','unit_cost','total_cost'] },
  supplierDebts: { table: 'supplier_debts', permission: 'supplier_debts', fields: ['debt_code','production_order_id','supplier_id','debt_date','category','description','amount_before_tax','tax_amount','total_amount','paid_amount','status'] },
  supplierPayments: { table: 'supplier_payments', permission: 'supplier_payments', fields: ['payment_code','supplier_debt_id','supplier_id','wallet_transaction_id','payment_date','amount','note'] },
  walletTransactions: { table: 'wallet_transactions', permission: 'wallet', fields: ['transaction_code','transaction_date','transaction_type','wallet','object_name','amount','reason','category','reference_type','reference_id'] },
  sales: { table: 'sales', permission: 'sales', fields: ['sale_code','sale_date','customer_id','customer_name','finished_product_id','product_name','quantity','revenue_before_tax','vat_amount','total_amount','unit_cost','cost_amount','profit','wallet_transaction_id','status','note'] },
  assets: { table: 'assets', permission: 'assets', fields: ['asset_code','name','purchase_price','purchase_date','depreciation_months','wallet','is_old_asset','status','wallet_transaction_id','note'] },
  loans: { table: 'loans', permission: 'loans', fields: ['loan_code','bank_name','principal_amount','interest_rate','term_months','start_date','payment_method','status','wallet_transaction_id','note'] },
  loanSchedules: { table: 'loan_schedules', permission: 'loans', fields: ['loan_id','period_number','due_date','principal_amount','interest_amount','total_payment','remaining_principal','status','paid_at'] },
  salaryPayments: { table: 'salary_payments', permission: 'salary', fields: ['employee_id','pay_date','net_salary','note'] },
  financialMonthlyReports: { table: 'financial_monthly_reports', permission: 'reports', fields: ['report_year','report_month','report_data'] },
  historyLogs: { table: 'history_logs', permission: 'reports', fields: [] }
};

const router = Router();
router.use(authenticate);
router.param('resource', (req, res, next, resource) => {
  const config = RESOURCES[resource];
  if (!config) return res.status(404).json({ message: 'Resource không hợp lệ.' });
  req.resourceConfig = config; next();
});
const permission = action => (req, res, next) => authorize(`${req.resourceConfig.permission}:${action}`)(req, res, next);

router.get('/:resource', permission('read'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const [rows] = await pool.query(`SELECT * FROM ${req.resourceConfig.table} ORDER BY id DESC LIMIT ?`, [limit]);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:resource/:id', permission('read'), async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [rows] = await pool.execute(`SELECT * FROM ${req.resourceConfig.table} WHERE id = ?`, [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Không tìm thấy dữ liệu.' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/:resource', permission('write'), async (req, res, next) => {
  try {
    const body = z.object({}).passthrough().parse(req.body);
    const fields = req.resourceConfig.fields.filter(field => body[field] !== undefined);
    if (!fields.length) return res.status(400).json({ message: 'Không có trường dữ liệu hợp lệ để lưu.' });
    if (req.resourceConfig.table === 'history_logs') return res.status(403).json({ message: 'Nhật ký chỉ được tạo bởi hệ thống.' });
    if (['wallet_transactions','salary_payments'].includes(req.resourceConfig.table)) { fields.push('created_by'); body.created_by = req.user.sub; }
    const [result] = await pool.execute(`INSERT INTO ${req.resourceConfig.table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`, fields.map(field => body[field]));
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'CREATE_' + req.params.resource, `Tạo ${req.params.resource} ID ${result.insertId}`]);
    res.status(201).json({ id: result.insertId });
  } catch (error) { next(error); }
});

router.patch('/:resource/:id', permission('write'), async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({}).passthrough().parse(req.body);
    const fields = req.resourceConfig.fields.filter(field => body[field] !== undefined);
    if (!fields.length || req.resourceConfig.table === 'history_logs') return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật.' });
    const [result] = await pool.execute(`UPDATE ${req.resourceConfig.table} SET ${fields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`, [...fields.map(field => body[field]), id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy dữ liệu.' });
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'UPDATE_' + req.params.resource, `Cập nhật ${req.params.resource} ID ${id}`]);
    res.json({ message: 'Đã cập nhật.' });
  } catch (error) { next(error); }
});

router.delete('/:resource/:id', permission('write'), async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    if (req.resourceConfig.table === 'history_logs') return res.status(403).json({ message: 'Không thể xóa nhật ký hệ thống.' });
    const [result] = await pool.execute(`DELETE FROM ${req.resourceConfig.table} WHERE id = ?`, [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy dữ liệu.' });
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'DELETE_' + req.params.resource, `Xóa ${req.params.resource} ID ${id}`]);
    res.json({ message: 'Đã xóa.' });
  } catch (error) { next(error); }
});

export default router;
