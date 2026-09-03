import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../src/config/db.js';

const username = process.env.BOOTSTRAP_ADMIN_USERNAME;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (!username || !password || password.length < 12) throw new Error('Thiết lập BOOTSTRAP_ADMIN_USERNAME và mật khẩu tối thiểu 12 ký tự trong .env.');
const hash = await bcrypt.hash(password, 12);
await pool.execute(
  'INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, \'ADMIN\', 1) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = \'ADMIN\', is_active = 1',
  [username, hash]
);
console.log(`Đã tạo/cập nhật tài khoản ADMIN: ${username}`);
await pool.end();
