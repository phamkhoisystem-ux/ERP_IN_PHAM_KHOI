import 'dotenv/config';
import app from './app.js';
import { dbHealthCheck } from './config/db.js';

const port = Number(process.env.PORT || 4000);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET phải có ít nhất 32 ký tự.');
await dbHealthCheck();
app.listen(port, () => console.log(`ERP API đang chạy tại http://localhost:${port}`));
