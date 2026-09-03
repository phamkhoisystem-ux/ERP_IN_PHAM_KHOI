import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const entityMap = {
  customers: { table: 'customers', permission: 'customers', fields: ['customer_code','name','date_of_birth','phone','email','address','tax_code','note'] },
  suppliers: { table: 'suppliers', permission: 'suppliers', fields: ['supplier_code','name','processing_type','contact_name','contact_date_of_birth','phone','email','address','tax_code','note'] },
  products: { table: 'finished_products', permission: 'products', fields: ['product_code','name','quantity','unit_cost','unit','note'] },
  materials: { table: 'material_items', permission: 'materials', fields: ['material_code','name','unit','quantity','warning_quantity','note'] }
};

router.use(authenticate);
router.param('entity', (req, res, next, entity) => {
  const config = entityMap[entity];
  if (!config) return res.status(404).json({ message: 'Danh mục không hợp lệ.' });
  req.entity = config; next();
});
router.get('/:entity', (req, res, next) => authorize(`${req.entity.permission}:read`)(req, res, next), async (req, res, next) => {
  try { const [rows] = await pool.query(`SELECT * FROM ${req.entity.table} ORDER BY id DESC`); res.json(rows); } catch (error) { next(error); }
});
router.post('/:entity', (req, res, next) => authorize(`${req.entity.permission}:write`)(req, res, next), async (req, res, next) => {
  try {
    const body = z.object({}).passthrough().parse(req.body);
    const fields = req.entity.fields.filter(field => body[field] !== undefined);
    if (!fields.includes('name')) return res.status(400).json({ message: 'Tên là bắt buộc.' });
    const [result] = await pool.execute(`INSERT INTO ${req.entity.table} (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`, fields.map(f => body[f]));
    res.status(201).json({ id: result.insertId });
  } catch (error) { next(error); }
});
router.patch('/:entity/:id', (req, res, next) => authorize(`${req.entity.permission}:write`)(req, res, next), async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const body = z.object({}).passthrough().parse(req.body);
    const fields = req.entity.fields.filter(field => body[field] !== undefined);
    if (!fields.length) return res.status(400).json({ message: 'Không có trường hợp lệ để cập nhật.' });
    const [result] = await pool.execute(`UPDATE ${req.entity.table} SET ${fields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`, [...fields.map(f => body[f]), id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy dữ liệu.' });
    res.json({ message: 'Đã cập nhật danh mục.' });
  } catch (error) { next(error); }
});
router.delete('/:entity/:id', (req, res, next) => authorize(`${req.entity.permission}:write`)(req, res, next), async (req, res, next) => {
  try {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const [result] = await pool.execute(`DELETE FROM ${req.entity.table} WHERE id = ?`, [id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Không tìm thấy dữ liệu.' });
    res.json({ message: 'Đã xóa danh mục.' });
  } catch (error) { next(error); }
});
export default router;
