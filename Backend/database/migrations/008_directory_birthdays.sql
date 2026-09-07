-- Chạy sau migration 007. Lưu ngày sinh để hiển thị sinh nhật trong Danh bạ.
ALTER TABLE employees
  ADD COLUMN date_of_birth DATE NULL AFTER name;

ALTER TABLE suppliers
  ADD COLUMN contact_date_of_birth DATE NULL AFTER contact_name;
