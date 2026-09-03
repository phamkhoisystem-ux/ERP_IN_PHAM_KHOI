import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/roles.js';

const router = Router();
const credentials = z.object({ username: z.string().trim().min(3).max(100), password: z.string().min(8).max(128) });

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = credentials.parse(req.body);
    const [rows] = await pool.execute('SELECT id, username, password_hash, role, is_active FROM users WHERE username = ? LIMIT 1', [username]);
    const user = rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }
    const token = jwt.sign({ sub: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [user.id, user.username, 'LOGIN', 'Đăng nhập hệ thống']);
    const [moduleRows] = await pool.execute('SELECT module_code FROM user_modules WHERE user_id = ? ORDER BY module_code', [user.id]);
    const modules = moduleRows.map(row => row.module_code);
    res.json({ accessToken: token, user: { id: user.id, username: user.username, role: user.role, modules, permissions: modules.length ? modules : (PERMISSIONS[user.role] || []) } });
  } catch (error) { next(error); }
});

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(128) }).parse(req.body);
    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ? LIMIT 1', [req.user.sub]);
    if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.sub]);
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'CHANGE_PASSWORD', 'Đổi mật khẩu tài khoản']);
    res.json({ message: 'Đã đổi mật khẩu.' });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, role, is_active, created_at FROM users WHERE id = ?', [req.user.sub]);
    if (!rows[0] || !rows[0].is_active) return res.status(401).json({ message: 'Tài khoản đã bị vô hiệu hóa.' });
    const [moduleRows] = await pool.execute('SELECT module_code FROM user_modules WHERE user_id = ? ORDER BY module_code', [req.user.sub]);
    const modules = moduleRows.map(row => row.module_code);
    res.json({ user: { ...rows[0], modules }, permissions: modules.length ? modules : (PERMISSIONS[rows[0].role] || []) });
  } catch (error) { next(error); }
});

export default router;
