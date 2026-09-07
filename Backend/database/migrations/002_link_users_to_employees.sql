-- Run once after database-v2.sql. It links the login account created by ADMIN
-- to the employee record used for payroll and HR reporting.
ALTER TABLE users
  ADD COLUMN employee_id BIGINT UNSIGNED NULL AFTER role,
  ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id)
    REFERENCES employees(id) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD UNIQUE KEY uq_users_employee (employee_id);
