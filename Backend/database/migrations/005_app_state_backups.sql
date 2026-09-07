-- Run once after 003_user_modules_and_app_state.sql.
-- Stores the state immediately before a Restore operation, allowing an
-- administrator to safely undo the most recent restore from the ERP UI.
CREATE TABLE app_state_backups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  state_json JSON NOT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  restored_by BIGINT UNSIGNED NULL,
  restored_at DATETIME NULL,
  CONSTRAINT fk_app_state_backups_created_by FOREIGN KEY (created_by)
    REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_app_state_backups_restored_by FOREIGN KEY (restored_by)
    REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
