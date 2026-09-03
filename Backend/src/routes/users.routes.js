import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { ROLES, PERMISSIONS, MODULES } from '../config/roles.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const createUser = z.object({
  username: z.string().trim().min(3).max(100), password: z.string().min(8).max(128),
  role: z.enum(Object.values(ROLES)), employeeId: z.coerce.number().int().positive().optional(), modules: z.array(z.enum(MODULES)).max(MODULES.length).default([])
});
const updateUser = z.object({ role: z.enum(Object.values(ROLES)).optional(), isActive: z.boolean().optional(), password: z.string().min(8).max(128).optional(), modules: z.array(z.enum(MODULES)).max(MODULES.length).optional() }).refine(v => Object.keys(v).length > 0);
const pinSchema = z.string().regex(/^\d{4,12}$/, 'Mã PIN phải gồm từ 4 đến 12 chữ số.');

router.use(authenticate, authorize('users:manage'));

function adminOnly(req, res, next) {
  if (req.user.role === 'ADMIN') return next();
  return res.status(403).json({ message: 'Chỉ ADMIN được quản lý mã PIN.' });
}

router.get('/security-pin/status', adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'admin_operation_pin_hash' LIMIT 1");
    res.json({ isSet: Boolean(rows[0]?.setting_value) });
  } catch (error) { next(error); }
});

router.post('/security-pin/verify', adminOnly, async (req, res, next) => {
  try {
    const pin = pinSchema.parse(req.body.pin);
    const [rows] = await pool.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'admin_operation_pin_hash' LIMIT 1");
    if (!rows[0]?.setting_value) return res.status(400).json({ message: 'Chưa tạo mã PIN quản trị.' });
    if (!(await bcrypt.compare(pin, rows[0].setting_value))) return res.status(401).json({ message: 'Mã PIN không đúng.' });
    res.json({ message: 'Xác minh mã PIN thành công.' });
  } catch (error) { next(error); }
});

router.put('/security-pin', adminOnly, async (req, res, next) => {
  try {
    const { currentPin, newPin } = z.object({ currentPin: z.string().optional(), newPin: pinSchema }).parse(req.body);
    const [rows] = await pool.execute("SELECT setting_value FROM system_settings WHERE setting_key = 'admin_operation_pin_hash' LIMIT 1");
    const exists = Boolean(rows[0]?.setting_value);
    if (exists && !(currentPin && await bcrypt.compare(pinSchema.parse(currentPin), rows[0].setting_value))) return res.status(400).json({ message: 'Mã PIN hiện tại không đúng.' });
    const hash = await bcrypt.hash(newPin, 12);
    await pool.execute("INSERT INTO system_settings (setting_key, setting_value, updated_by) VALUES ('admin_operation_pin_hash', ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)", [hash, req.user.sub]);
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, exists ? 'CHANGE_ADMIN_PIN' : 'CREATE_ADMIN_PIN', exists ? 'Đổi mã PIN quản trị' : 'Tạo mã PIN quản trị']);
    res.json({ message: exists ? 'Đã đổi mã PIN quản trị.' : 'Đã tạo mã PIN quản trị.' });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT u.id, u.username, u.role, u.is_active, u.created_at, u.updated_at,
      GROUP_CONCAT(um.module_code ORDER BY um.module_code) AS modules
      FROM users u LEFT JOIN user_modules um ON um.user_id = u.id GROUP BY u.id ORDER BY u.username`);
    res.json(rows.map(row => ({ ...row, modules: row.modules ? row.modules.split(',') : [] })));
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, password, role, employeeId, modules } = createUser.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute('INSERT INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)', [username, hash, role, employeeId ?? null]);
      for (const moduleCode of modules) await connection.execute('INSERT INTO user_modules (user_id, module_code) VALUES (?, ?)', [result.insertId, moduleCode]);
      await connection.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'CREATE_USER', `Cấp tài khoản ${username}, role ${role}, modules: ${modules.join(', ') || 'không có'}`]);
      await connection.commit();
      res.status(201).json({ id: result.insertId, username, role, modules, isActive: true, permissions: modules.length ? modules : (PERMISSIONS[role] || []) });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) { next(error); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const data = updateUser.parse(req.body);
    if (id === req.user.sub && data.isActive === false) return res.status(400).json({ message: 'Không thể tự khóa tài khoản đang đăng nhập.' });
    const fields = [], values = [];
    if (data.role) { fields.push('role = ?'); values.push(data.role); }
    if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive); }
    if (data.password) { fields.push('password_hash = ?'); values.push(await bcrypt.hash(data.password, 12)); }
    let found = true;
    if (fields.length) {
      values.push(id);
      const [result] = await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
      found = Boolean(result.affectedRows);
    } else {
      const [rows] = await pool.execute('SELECT id FROM users WHERE id = ?', [id]);
      found = Boolean(rows[0]);
    }
    if (!found) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    if (data.modules) {
      await pool.execute('DELETE FROM user_modules WHERE user_id = ?', [id]);
      for (const moduleCode of data.modules) await pool.execute('INSERT INTO user_modules (user_id, module_code) VALUES (?, ?)', [id, moduleCode]);
    }
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'UPDATE_USER', `Cập nhật tài khoản ID ${id}`]);
    res.json({ message: 'Đã cập nhật tài khoản.' });
  } catch (error) { next(error); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    // Keep destructive account deletion exclusively with an ADMIN account,
    // even if permission mappings are adjusted later.
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Chỉ ADMIN được xóa tài khoản.' });
    const id = z.coerce.number().int().positive().parse(req.params.id);
    if (id === req.user.sub) return res.status(400).json({ message: 'Không thể tự xóa tài khoản đang đăng nhập.' });

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute('SELECT id, username, role FROM users WHERE id = ? FOR UPDATE', [id]);
      const user = rows[0];
      if (!user) { const error = new Error('Không tìm thấy người dùng.'); error.status = 404; error.expose = true; throw error; }
      if (user.role === 'ADMIN') {
        const [admins] = await connection.query("SELECT COUNT(*) AS total FROM users WHERE role = 'ADMIN' AND is_active = 1");
        if (Number(admins[0].total) <= 1) { const error = new Error('Không thể xóa tài khoản ADMIN cuối cùng.'); error.status = 400; error.expose = true; throw error; }
      }
      await connection.execute('DELETE FROM users WHERE id = ?', [id]);
      await connection.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'DELETE_USER', `Xóa tài khoản ${user.username} (ID ${id})`]);
      await connection.commit();
      res.json({ message: `Đã xóa tài khoản ${user.username}.` });
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  } catch (error) { next(error); }
});

export default router;
