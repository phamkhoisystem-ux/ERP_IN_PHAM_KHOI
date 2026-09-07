-- Chạy một lần sau migration 003.
-- Bổ sung trường Danh bạ theo yêu cầu nghiệp vụ.
ALTER TABLE customers
  ADD COLUMN date_of_birth DATE NULL AFTER name;

ALTER TABLE suppliers
  ADD COLUMN processing_type VARCHAR(50) NULL AFTER name,
  ADD COLUMN contact_name VARCHAR(255) NULL AFTER processing_type;
