-- Run after 002_link_users_to_employees.sql
CREATE TABLE user_modules (
  user_id BIGINT UNSIGNED NOT NULL,
  module_code VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, module_code),
  CONSTRAINT fk_user_modules_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Stores the current UI state in MySQL while legacy screens are progressively
-- mapped to the normalized ERP tables. This replaces Google Sheets/local-only save.
CREATE TABLE app_states (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  state_json JSON NOT NULL,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_app_states_singleton CHECK (id = 1),
  CONSTRAINT fk_app_states_user FOREIGN KEY (updated_by)
    REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
