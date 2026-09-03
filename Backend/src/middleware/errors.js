export function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy API ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Dữ liệu đã tồn tại.' });
  if (error.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'Không thể xóa vì dữ liệu này đã được dùng trong chứng từ.' });
  if (error.code === 'ER_BAD_FIELD_ERROR') return res.status(500).json({ message: 'Cấu trúc database chưa đủ cột cần thiết. Hãy chạy migration mới nhất.' });
  if (error.name === 'ZodError') return res.status(400).json({ message: 'Dữ liệu gửi lên không hợp lệ.', errors: error.issues });
  res.status(error.status || 500).json({ message: error.expose ? error.message : 'Lỗi máy chủ.' });
}
