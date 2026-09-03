import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/production-orders', authorize('orders:read'), async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM production_orders ORDER BY deadline IS NULL, deadline, id DESC');
    res.json(rows);
  } catch (error) { next(error); }
});

router.patch('/production-orders/:id/status', authorize('orders:update_status'), async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({ status: z.enum(['Đang in','Đang gia công','Hoàn thành','HỦY','HOLD','OTHER']), actualQuantity: z.coerce.number().nonnegative().optional(), note: z.string().max(5000).optional() }).parse(req.body);
    const values = [body.status, body.actualQuantity ?? 0, body.note ?? null, id];
    const [result] = await pool.execute('UPDATE production_orders SET status = ?, actual_quantity = ?, note = COALESCE(?, note) WHERE id = ?', values);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy lệnh sản xuất.' });
    await pool.execute('INSERT INTO history_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)', [req.user.sub, req.user.username, 'UPDATE_ORDER_STATUS', `Lệnh ${id}: ${body.status}`]);
    res.json({ message: 'Đã cập nhật trạng thái lệnh.' });
  } catch (error) { next(error); }
});

router.post('/material-transactions', authorize('materials:write'), async (req, res, next) => {
  try {
    const body = z.object({ materialId: z.coerce.number().int().positive(), transactionCode: z.string().min(3).max(50), transactionType: z.enum(['IN','OUT','ADJUSTMENT','RETURN','OTHER']), quantity: z.coerce.number().refine(v => v !== 0), unit: z.string().max(50).optional(), unitPrice: z.coerce.number().nonnegative().default(0), note: z.string().max(5000).optional(), supplierId: z.coerce.number().int().positive().optional() }).parse(req.body);
    const [result] = await pool.execute(
      'INSERT INTO material_transactions (material_id, transaction_code, transaction_type, quantity, unit, unit_price, note, supplier_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [body.materialId, body.transactionCode, body.transactionType, body.quantity, body.unit ?? null, body.unitPrice, body.note ?? null, body.supplierId ?? null, req.user.sub]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) { next(error); }
});

router.get('/wallet-transactions', authorize('wallet:read'), async (req, res, next) => {
  try { const [rows] = await pool.query('SELECT * FROM wallet_transactions ORDER BY transaction_date DESC, id DESC LIMIT 500'); res.json(rows); } catch (error) { next(error); }
});

router.get('/history', authorize('reports:read'), async (req, res, next) => {
  try { const [rows] = await pool.query('SELECT id, user_name, action, details, created_at FROM history_logs ORDER BY id DESC LIMIT 500'); res.json(rows); } catch (error) { next(error); }
});

export default router;
