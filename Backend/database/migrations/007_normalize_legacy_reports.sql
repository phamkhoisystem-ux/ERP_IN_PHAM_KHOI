-- Run once after 006_system_settings.sql.
-- Mirrors legacy JSON-only modules into queryable MySQL tables.
CREATE TABLE production_shift_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  log_code VARCHAR(60) NOT NULL,
  production_order_id BIGINT UNSIGNED NULL,
  order_code VARCHAR(60) NULL,
  work_date DATE NULL,
  shift_name VARCHAR(100) NULL,
  target_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  good_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  defect_quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  worker_count INT NOT NULL DEFAULT 0,
  uptime_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  downtime_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  overtime_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  raw_data JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_production_shift_logs_code (log_code),
  KEY idx_production_shift_logs_date (work_date),
  CONSTRAINT fk_production_shift_logs_order FOREIGN KEY (production_order_id)
    REFERENCES production_orders(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE financial_monthly_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  report_year SMALLINT UNSIGNED NOT NULL,
  report_month TINYINT UNSIGNED NOT NULL,
  report_data JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_financial_month (report_year, report_month),
  CONSTRAINT chk_financial_month CHECK (report_month BETWEEN 1 AND 12),
  CONSTRAINT fk_financial_reports_user FOREIGN KEY (updated_by)
    REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
