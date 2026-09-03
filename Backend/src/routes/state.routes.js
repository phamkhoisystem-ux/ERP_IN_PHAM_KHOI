import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { syncLegacyState } from '../services/legacy-state-sync.js';

const router = Router();
router.use(authenticate);

function requireAdmin(req, res, next) {
  if (req.user.role === 'ADMIN') return next();
  return res.status(403).json({ message: 'Chỉ quản trị viên được dùng chức năng sao lưu dữ liệu.' });
}

const emptyErpState = Object.freeze({
  keHoach: [], sanXuat: [], khoVatTu: [], khoAnPham: [], banHang: [],
  chiTietNo: [], lichSuThanhToan: [], nccList: [], nhatKyCa: [], taiChinh: [],
  nhanSu: [], taiSan: [], khoanVay: [], giaoDichVi: [], lichSuVatTu: [], historyLog: []
});

function mayUseErp(req, res, next) {
  if (req.user.role === 'ADMIN' || req.user.modules.length || req.user.role !== 'OTHER') return next();
  return res.status(403).json({ message: 'Tài khoản chưa được cấp module nghiệp vụ.' });
}

router.get('/', mayUseErp, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT state_json, updated_at FROM app_states WHERE id = 1');
    res.json({ state: rows[0]?.state_json || null, updatedAt: rows[0]?.updated_at || null });
  } catch (error) { next(error); }
});

router.put('/', mayUseErp, async (req, res, next) => {
  try {
    const state = z.object({}).passthrough().parse(req.body);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute('INSERT INTO app_states (id, state_json, updated_by) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_by = VALUES(updated_by)', [JSON.stringify(state), req.user.sub]);
      await syncLegacyState(connection, state, req.user.sub);
      await connection.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'SAVE_APP_STATE', 'Lưu trạng thái ERP và đồng bộ bảng nghiệp vụ MySQL']);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    res.json({ message: 'Đã lưu dữ liệu vào MySQL.' });
  } catch (error) { next(error); }
});

// The export is intentionally limited to the ERP application state. User
// accounts and password hashes are never included in a downloaded file.
router.get('/backup', requireAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT state_json, updated_at FROM app_states WHERE id = 1');
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'BACKUP_APP_STATE', 'Tải bản sao lưu dữ liệu ERP dạng JSON']);
    res.json({ exportedAt: new Date().toISOString(), updatedAt: rows[0]?.updated_at || null, state: rows[0]?.state_json || {} });
  } catch (error) { next(error); }
});

router.post('/restore', requireAdmin, async (req, res, next) => {
  try {
    const state = z.object({ state: z.object({}).passthrough() }).parse(req.body).state;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [current] = await connection.query('SELECT state_json FROM app_states WHERE id = 1 FOR UPDATE');
      // Keep the state before a restore so it can be recovered through Undo.
      await connection.execute('INSERT INTO app_state_backups (state_json, created_by) VALUES (?, ?)', [JSON.stringify(current[0]?.state_json || {}), req.user.sub]);
      await connection.execute('INSERT INTO app_states (id, state_json, updated_by) VALUES (1, ?, ?) ON DUPLICATE KEY UPDATE state_json = VALUES(state_json), updated_by = VALUES(updated_by)', [JSON.stringify(state), req.user.sub]);
      await syncLegacyState(connection, state, req.user.sub);
      await connection.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'RESTORE_APP_STATE', 'Khôi phục dữ liệu ERP từ file JSON']);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    res.json({ message: 'Đã khôi phục dữ liệu.', state });
  } catch (error) { next(error); }
});

router.post('/undo', requireAdmin, async (req, res, next) => {
  try {
    const connection = await pool.getConnection();
    let state;
    try {
      await connection.beginTransaction();
      const [backups] = await connection.query('SELECT id, state_json FROM app_state_backups WHERE restored_at IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE');
      if (!backups[0]) { const error = new Error('Không có bản khôi phục nào để hoàn tác.'); error.status = 400; error.expose = true; throw error; }
      state = backups[0].state_json;
      await connection.execute('UPDATE app_states SET state_json = ?, updated_by = ? WHERE id = 1', [JSON.stringify(state), req.user.sub]);
      await syncLegacyState(connection, state, req.user.sub);
      await connection.execute('UPDATE app_state_backups SET restored_at = CURRENT_TIMESTAMP, restored_by = ? WHERE id = ?', [req.user.sub, backups[0].id]);
      await connection.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'UNDO_RESTORE_APP_STATE', 'Hoàn tác khôi phục dữ liệu ERP']);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    res.json({ message: 'Đã hoàn tác bản khôi phục.', state });
  } catch (error) { next(error); }
});

router.post('/reset', requireAdmin, async (req, res, next) => {
  try {
    const { pin, confirmation } = z.object({
      pin: z.string().regex(/^\d{4,12}$/),
      confirmation: z.literal('XOA DU LIEU')
    }).parse(req.body);
    const [settings] = await pool.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'admin_operation_pin_hash' LIMIT 1");
    if (!settings[0]?.setting_value) return res.status(400).json({ message: 'Hãy tạo mã PIN quản trị trước khi xóa dữ liệu.' });
    if (!(await bcrypt.compare(pin, settings[0].setting_value))) return res.status(401).json({ message: 'Mã PIN không đúng.' });

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Child tables are cleared first. Accounts, permissions, PIN settings and
      // security history are deliberately preserved so the ERP remains usable.
      for (const table of [
        'supplier_payments', 'supplier_debts', 'salary_payments',
        'production_order_materials', 'material_transactions', 'sales', 'assets',
        'loan_schedules', 'loans', 'wallet_transactions', 'financial_monthly_reports',
        'production_shift_logs', 'production_plan_details',
        'production_orders', 'production_plans', 'material_items', 'finished_products',
        'suppliers', 'customers', 'employees', 'app_state_backups', 'app_states'
      ]) await connection.query(`DELETE FROM ${table}`);
      await connection.execute('INSERT INTO app_states (id, state_json, updated_by) VALUES (1, ?, ?)', [JSON.stringify(emptyErpState), req.user.sub]);
      await connection.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'RESET_ERP_DATA', 'Xóa toàn bộ dữ liệu nghiệp vụ ERP; giữ lại tài khoản, quyền và PIN quản trị']);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    res.json({ message: 'Đã xóa dữ liệu nghiệp vụ trong MySQL.', state: emptyErpState });
  } catch (error) { next(error); }
});

export default router;
