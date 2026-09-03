import jwt from 'jsonwebtoken';
import { hasPermission } from '../config/roles.js';
import { pool } from '../config/db.js';

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Thiếu access token.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute('SELECT module_code FROM user_modules WHERE user_id = ?', [req.user.sub]);
    req.user.modules = rows.map(row => row.module_code);
    return next();
  } catch {
    return res.status(401).json({ message: 'Access token không hợp lệ hoặc đã hết hạn.' });
  }
}

export const authorize = (...permissions) => (req, res, next) => {
  if (permissions.every(permission => hasPermission(req.user.role, permission, req.user.modules))) return next();
  return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
};
