const number = value => Number(String(value ?? 0).replace(/,/g, '')) || 0;
const dateOnly = value => /^\d{4}-\d{2}-\d{2}/.test(String(value || '')) ? String(value).slice(0, 10) : null;
const json = value => JSON.stringify(value ?? null);

async function findOrCreate(connection, table, name) {
  if (!name) return null;
  const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE name = ? LIMIT 1`, [String(name).trim()]);
  if (rows[0]) return rows[0].id;
  const [result] = await connection.execute(`INSERT INTO ${table} (name) VALUES (?)`, [String(name).trim()]);
  return result.insertId;
}

async function upsertByCode(connection, table, codeColumn, code, insert, update) {
  const [rows] = await connection.execute(`SELECT id FROM ${table} WHERE ${codeColumn} = ? LIMIT 1`, [code]);
  if (rows[0]) { await connection.execute(`UPDATE ${table} SET ${update.sql} WHERE id = ?`, [...update.values, rows[0].id]); return rows[0].id; }
  const [result] = await connection.execute(`INSERT INTO ${table} (${insert.columns.join(',')}) VALUES (${insert.columns.map(() => '?').join(',')})`, insert.values);
  return result.insertId;
}

export async function syncLegacyState(connection, state, userId) {
  const supplierCache = new Map(), productCache = new Map(), customerCache = new Map(), materialCache = new Map(), employeeCache = new Map(), planCache = new Map(), orderCache = new Map(), walletCache = new Map();
  const supplierId = async name => { if (!name) return null; if (!supplierCache.has(name)) supplierCache.set(name, await findOrCreate(connection, 'suppliers', name)); return supplierCache.get(name); };
  const productId = async item => {
    const name = item?.name || item; if (!name) return null;
    if (productCache.has(name)) return productCache.get(name);
    const id = await upsertByCode(connection, 'finished_products', 'product_code', `LEG-${name}`, { columns: ['product_code','name','quantity','unit_cost','unit'], values: [`LEG-${name}`,name,number(item?.qty),number(item?.unitCost),'SP'] }, { sql: 'name=?, quantity=?, unit_cost=?', values: [name,number(item?.qty),number(item?.unitCost)] });
    productCache.set(name, id); return id;
  };
  const materialId = async item => {
    const name = item?.name || item; if (!name) return null;
    if (materialCache.has(name)) return materialCache.get(name);
    const code = `LEG-${name}`;
    const id = await upsertByCode(connection, 'material_items', 'material_code', code, { columns: ['material_code','name','unit','quantity','warning_quantity'], values: [code,name,item?.dvt || 'Cái',number(item?.qty),number(item?.warn)] }, { sql: 'name=?, unit=?, quantity=?, warning_quantity=?', values: [name,item?.dvt || 'Cái',number(item?.qty),number(item?.warn)] });
    materialCache.set(name, id); return id;
  };
  const customerId = async name => { if (!name) return null; if (!customerCache.has(name)) customerCache.set(name, await findOrCreate(connection, 'customers', name)); return customerCache.get(name); };

  for (const item of state.khoAnPham || []) await productId(item);
  for (const item of state.khoVatTu || []) await materialId(item);
  for (const name of state.nccList || []) await supplierId(name);

  for (const [index, tx] of (state.lichSuVatTu || []).entries()) {
    const material = await materialId(tx);
    if (!material || !tx?.qty) continue;
    const code = tx.id || `LEG-MT-${index}`;
    const type = tx.type === 'NHẬP' ? 'IN' : 'OUT';
    const [exists] = await connection.execute('SELECT id FROM material_transactions WHERE transaction_code = ? LIMIT 1', [code]);
    if (!exists[0]) await connection.execute('INSERT INTO material_transactions (material_id, transaction_code, transaction_date, transaction_type, quantity, unit, unit_price, note, created_by) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)', [material, code, dateOnly(tx.date) || new Date(), type, Math.abs(number(tx.qty)), tx.dvt || null, tx.note || null, userId]);
  }
  // Transaction triggers maintain a ledger; the legacy screen is authoritative for the closing balance.
  for (const item of state.khoVatTu || []) await connection.execute('UPDATE material_items SET quantity=?, warning_quantity=? WHERE id=?', [number(item.qty), number(item.warn), await materialId(item)]);

  for (const employee of state.nhanSu || []) {
    const code = employee.id || `LEG-EMP-${employee.name}`;
    const id = await upsertByCode(connection, 'employees', 'employee_code', code,
      { columns: ['employee_code','name','phone','start_date','end_date','position','level','employee_type','status','base_salary','kpi_revenue','kpi_percent','part_time_rate','part_time_hours','bonus','deduct'], values: [code,employee.name || code,employee.phone || null,dateOnly(employee.startDate),dateOnly(employee.endDate),employee.position || null,employee.level || null,employee.type || null,employee.status === 'Đã nghỉ' ? 'INACTIVE' : 'ACTIVE',number(employee.baseSalary),number(employee.kpiRevenue),number(employee.kpiPercent),number(employee.partTimeRate),number(employee.partTimeHours),number(employee.bonus),number(employee.deduct)] },
      { sql: 'name=?, phone=?, start_date=?, end_date=?, position=?, level=?, employee_type=?, status=?, base_salary=?, kpi_revenue=?, kpi_percent=?, part_time_rate=?, part_time_hours=?, bonus=?, deduct=?', values: [employee.name || code,employee.phone || null,dateOnly(employee.startDate),dateOnly(employee.endDate),employee.position || null,employee.level || null,employee.type || null,employee.status === 'Đã nghỉ' ? 'INACTIVE' : 'ACTIVE',number(employee.baseSalary),number(employee.kpiRevenue),number(employee.kpiPercent),number(employee.partTimeRate),number(employee.partTimeHours),number(employee.bonus),number(employee.deduct)] });
    employeeCache.set(code, id);
    for (const payment of employee.paymentHistory || []) {
      const payDate = dateOnly(payment.payDate); if (!payDate) continue;
      const [exists] = await connection.execute('SELECT id FROM salary_payments WHERE employee_id=? AND pay_date=? AND net_salary=? LIMIT 1', [id,payDate,number(payment.netSalary)]);
      if (!exists[0]) await connection.execute('INSERT INTO salary_payments (employee_id,pay_date,net_salary,note,created_by) VALUES (?,?,?,?,?)', [id,payDate,number(payment.netSalary),payment.note || null,userId]);
    }
  }

  for (const plan of state.keHoach || []) {
    const product = await productId({ name: plan.baiIn, qty: 0, unitCost: 0 });
    const planId = await upsertByCode(connection, 'production_plans', 'plan_code', plan.idSX,
      { columns: ['plan_code','name','finished_product_id','finished_product_name','plan_type','plan_date','deadline','total_amount','is_hold','status','details_json','rollback_data_json','raw_data_json','created_by'], values: [plan.idSX,plan.ten || null,product,plan.baiIn || null,plan.type || null,dateOnly(plan.date),dateOnly(plan.deadline),number(plan.tongTien),plan.isHold ? 1 : 0,plan.isHold ? 'HOLD' : 'ACTIVE',json(plan.details),json(plan.rollbackData),json(plan.rawData),userId] },
      { sql: 'name=?, finished_product_id=?, finished_product_name=?, plan_type=?, plan_date=?, deadline=?, total_amount=?, is_hold=?, status=?, details_json=?, rollback_data_json=?, raw_data_json=?', values: [plan.ten || null,product,plan.baiIn || null,plan.type || null,dateOnly(plan.date),dateOnly(plan.deadline),number(plan.tongTien),plan.isHold ? 1 : 0,plan.isHold ? 'HOLD' : 'ACTIVE',json(plan.details),json(plan.rollbackData),json(plan.rawData)] });
    planCache.set(plan.idSX, planId);
    await connection.execute('DELETE FROM production_plan_details WHERE production_plan_id = ?', [planId]);
    for (const detail of plan.details || []) {
      const supplier = await supplierId(detail.ncc);
      await connection.execute('INSERT INTO production_plan_details (production_plan_id,detail_type,supplier_id,description,total_amount,extra_data) VALUES (?,?,?,?,?,?)', [planId,detail.khau || 'OTHER',supplier,detail.thongtin || null,number(detail.tien),json(detail)]);
    }
  }
  for (const order of state.sanXuat || []) {
    const planId = planCache.get(order.idSX) || null;
    const product = await productId({ name: order.baiIn, qty: 0, unitCost: 0 });
    const id = await upsertByCode(connection, 'production_orders', 'order_code', order.idSX,
      { columns: ['production_plan_id','order_code','finished_product_id','finished_product_name','status','deadline','actual_quantity','note'], values: [planId,order.idSX,product,order.baiIn || null,order.status || 'Đang in',dateOnly(order.deadline),number(order.actualQty),order.note || null] },
      { sql: 'production_plan_id=?, finished_product_id=?, finished_product_name=?, status=?, deadline=?, actual_quantity=?, note=?', values: [planId,product,order.baiIn || null,order.status || 'Đang in',dateOnly(order.deadline),number(order.actualQty),order.note || null] });
    orderCache.set(order.idSX, id);
  }

  // Supplier payments are inserted below after wallet transactions are mapped.
  // Start debt balances at zero, then set the legacy authoritative total after
  // payment rows are synchronized so trigger updates cannot double-count.
  for (const [index, debt] of (state.chiTietNo || []).entries()) {
    const supplier = await supplierId(debt.ncc); if (!supplier) continue;
    const code = debt.id || `LEG-DEBT-${debt.idSX || 'GENERAL'}-${index}`;
    const total = number(debt.tongTien); const paid = 0;
    await upsertByCode(connection, 'supplier_debts', 'debt_code', code,
      { columns: ['debt_code','production_order_id','supplier_id','debt_date','category','description','amount_before_tax','tax_amount','total_amount','paid_amount','status'], values: [code,orderCache.get(debt.idSX) || null,supplier,dateOnly(debt.date) || new Date(),debt.khau || null,debt.thongtin || null,number(debt.tienChuaVat),number(debt.tienVat),total,paid,paid >= total && total ? 'PAID' : paid ? 'PARTIAL' : 'UNPAID'] },
      { sql: 'production_order_id=?, supplier_id=?, debt_date=?, category=?, description=?, amount_before_tax=?, tax_amount=?, total_amount=?, paid_amount=?, status=?', values: [orderCache.get(debt.idSX) || null,supplier,dateOnly(debt.date) || new Date(),debt.khau || null,debt.thongtin || null,number(debt.tienChuaVat),number(debt.tienVat),total,paid,paid >= total && total ? 'PAID' : paid ? 'PARTIAL' : 'UNPAID'] });
  }

  for (const wallet of state.giaoDichVi || []) {
    const code = wallet.idGD || `LEG-WALLET-${wallet.date}-${wallet.doiTuong}`;
    const id = await upsertByCode(connection, 'wallet_transactions', 'transaction_code', code,
      { columns: ['transaction_code','transaction_date','transaction_type','wallet','object_name','amount','reason','category','created_by'], values: [code,dateOnly(wallet.date) || new Date(),wallet.loai === 'CHI' ? 'CHI' : 'THU',wallet.vi || 'TIENMAT',wallet.doiTuong || null,number(wallet.soTien),wallet.lyDo || null,wallet.hangMuc || null,userId] },
      { sql: 'transaction_date=?, transaction_type=?, wallet=?, object_name=?, amount=?, reason=?, category=?', values: [dateOnly(wallet.date) || new Date(),wallet.loai === 'CHI' ? 'CHI' : 'THU',wallet.vi || 'TIENMAT',wallet.doiTuong || null,number(wallet.soTien),wallet.lyDo || null,wallet.hangMuc || null] });
    walletCache.set(code,id);
  }

  // Legacy payment history used to exist only inside app_states. Mirror it to
  // the normalized supplier_payments ledger and link each row to its debt and
  // wallet transaction where the source data provides those references.
  for (const [index, payment] of (state.lichSuThanhToan || []).entries()) {
    const supplier = await supplierId(payment.ncc); if (!supplier) continue;
    const paymentCode = payment.idTT || `LEG-PAYMENT-${payment.idGD || index}`;
    const [alreadyExists] = await connection.execute('SELECT id FROM supplier_payments WHERE payment_code = ? LIMIT 1', [paymentCode]);
    if (alreadyExists[0]) continue;
    const orderId = orderCache.get(payment.idSX) || null;
    const [debts] = orderId
      ? await connection.execute('SELECT id FROM supplier_debts WHERE supplier_id = ? AND production_order_id = ? ORDER BY id DESC LIMIT 1', [supplier, orderId])
      : await connection.execute('SELECT id FROM supplier_debts WHERE supplier_id = ? AND production_order_id IS NULL ORDER BY id DESC LIMIT 1', [supplier]);
    if (!debts[0]) continue;
    await connection.execute('INSERT INTO supplier_payments (payment_code, supplier_debt_id, supplier_id, wallet_transaction_id, payment_date, amount, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      paymentCode, debts[0].id, supplier, walletCache.get(payment.idGD) || null,
      dateOnly(payment.date) || new Date(), number(payment.amount), payment.note || null, userId
    ]);
  }

  // Retain the value seen by users in the legacy screen as the closing balance.
  for (const debt of state.chiTietNo || []) {
    const supplier = await supplierId(debt.ncc); if (!supplier) continue;
    const orderId = orderCache.get(debt.idSX) || null;
    const [rows] = orderId
      ? await connection.execute('SELECT id FROM supplier_debts WHERE supplier_id = ? AND production_order_id = ? ORDER BY id DESC LIMIT 1', [supplier, orderId])
      : await connection.execute('SELECT id FROM supplier_debts WHERE supplier_id = ? AND production_order_id IS NULL ORDER BY id DESC LIMIT 1', [supplier]);
    if (!rows[0]) continue;
    const total = number(debt.tongTien), paid = number(debt.daTra);
    await connection.execute('UPDATE supplier_debts SET paid_amount = ?, status = ? WHERE id = ?', [paid, paid >= total && total ? 'PAID' : paid ? 'PARTIAL' : 'UNPAID', rows[0].id]);
  }

  for (const [index, log] of (state.nhatKyCa || []).entries()) {
    const logCode = log.id || `LEG-SHIFT-${index}`;
    const orderId = orderCache.get(log.idSX) || null;
    await upsertByCode(connection, 'production_shift_logs', 'log_code', logCode,
      { columns: ['log_code','production_order_id','order_code','work_date','shift_name','target_quantity','good_quantity','defect_quantity','worker_count','uptime_hours','downtime_hours','overtime_hours','raw_data'], values: [logCode,orderId,log.idSX || null,dateOnly(log.date),log.ca || null,number(log.target),number(log.pass),number(log.defect),number(log.workers),number(log.uptime),number(log.downtime),number(log.ot),json(log)] },
      { sql: 'production_order_id=?, order_code=?, work_date=?, shift_name=?, target_quantity=?, good_quantity=?, defect_quantity=?, worker_count=?, uptime_hours=?, downtime_hours=?, overtime_hours=?, raw_data=?', values: [orderId,log.idSX || null,dateOnly(log.date),log.ca || null,number(log.target),number(log.pass),number(log.defect),number(log.workers),number(log.uptime),number(log.downtime),number(log.ot),json(log)] });
  }

  for (const report of state.taiChinh || []) {
    const reportYear = Number(report.year), reportMonth = Number(report.month);
    if (!Number.isInteger(reportYear) || !Number.isInteger(reportMonth) || reportMonth < 1 || reportMonth > 12) continue;
    await connection.execute('INSERT INTO financial_monthly_reports (report_year, report_month, report_data, updated_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE report_data = VALUES(report_data), updated_by = VALUES(updated_by)', [reportYear, reportMonth, json(report), userId]);
  }

  for (const sale of state.banHang || []) {
    const customer = await customerId(sale.kh); const product = await productId({ name: sale.anPham, qty: 0, unitCost: 0 });
    await upsertByCode(connection, 'sales', 'sale_code', sale.idBH || `LEG-SALE-${sale.date}-${sale.kh}`,
      { columns: ['sale_code','sale_date','customer_id','customer_name','finished_product_id','product_name','quantity','revenue_before_tax','vat_amount','total_amount','unit_cost','cost_amount','profit','status','created_by'], values: [sale.idBH || `LEG-SALE-${sale.date}-${sale.kh}`,dateOnly(sale.date) || new Date(),customer,sale.kh || null,product,sale.anPham || null,number(sale.sl),number(sale.tien),number(sale.tienThuVat)-number(sale.tien),number(sale.tienThuVat || sale.tien),0,number(sale.tien)-number(sale.loiNhuan),number(sale.loiNhuan),'COMPLETED',userId] },
      { sql: 'sale_date=?, customer_id=?, customer_name=?, finished_product_id=?, product_name=?, quantity=?, revenue_before_tax=?, vat_amount=?, total_amount=?, cost_amount=?, profit=?', values: [dateOnly(sale.date) || new Date(),customer,sale.kh || null,product,sale.anPham || null,number(sale.sl),number(sale.tien),number(sale.tienThuVat)-number(sale.tien),number(sale.tienThuVat || sale.tien),number(sale.tien)-number(sale.loiNhuan),number(sale.loiNhuan)] });
  }

  for (const asset of state.taiSan || []) await upsertByCode(connection, 'assets', 'asset_code', asset.id || `LEG-ASSET-${asset.name}`,
    { columns: ['asset_code','name','purchase_price','purchase_date','depreciation_months','wallet','is_old_asset','status','note'], values: [asset.id || `LEG-ASSET-${asset.name}`,asset.name,number(asset.gia || asset.purchasePrice),dateOnly(asset.ngay || asset.purchaseDate),number(asset.thangKhauHao || asset.depreciationMonths),asset.wallet || null,asset.isOld ? 1 : 0,asset.status === 'Đã thanh lý' ? 'SOLD' : 'ACTIVE',asset.note || null] },
    { sql: 'name=?, purchase_price=?, purchase_date=?, depreciation_months=?, wallet=?, is_old_asset=?, status=?, note=?', values: [asset.name,number(asset.gia || asset.purchasePrice),dateOnly(asset.ngay || asset.purchaseDate),number(asset.thangKhauHao || asset.depreciationMonths),asset.wallet || null,asset.isOld ? 1 : 0,asset.status === 'Đã thanh lý' ? 'SOLD' : 'ACTIVE',asset.note || null] });

  for (const loan of state.khoanVay || []) await upsertByCode(connection, 'loans', 'loan_code', loan.id || `LEG-LOAN-${loan.bank}`,
    { columns: ['loan_code','bank_name','principal_amount','interest_rate','term_months','start_date','payment_method','status','note'], values: [loan.id || `LEG-LOAN-${loan.bank}`,loan.bank || 'Chưa rõ',number(loan.amount),number(loan.rate),number(loan.term),dateOnly(loan.start || loan.date),loan.method || null,loan.status === 'Đã tất toán' ? 'PAID' : 'ACTIVE',loan.note || null] },
    { sql: 'bank_name=?, principal_amount=?, interest_rate=?, term_months=?, start_date=?, payment_method=?, status=?, note=?', values: [loan.bank || 'Chưa rõ',number(loan.amount),number(loan.rate),number(loan.term),dateOnly(loan.start || loan.date),loan.method || null,loan.status === 'Đã tất toán' ? 'PAID' : 'ACTIVE',loan.note || null] });
}
