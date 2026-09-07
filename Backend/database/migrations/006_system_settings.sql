-- Run once after 005_app_state_backups.sql.
-- Values such as the administrator operation PIN are stored as bcrypt hashes.
CREATE TABLE system_settings (
  setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_system_settings_updated_by FOREIGN KEY (updated_by)
    REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
