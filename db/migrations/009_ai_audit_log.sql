-- Migration 009: AI Audit Log Table
-- Base: autodiag_dev (Compatible MariaDB 10.4)
-- Date: 2026-10-15

CREATE TABLE IF NOT EXISTS ai_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT DEFAULT NULL,
  module VARCHAR(30) NOT NULL COMMENT 'entry, explain, fallback',
  prompt_hash VARCHAR(64) NOT NULL,
  response LONGTEXT NOT NULL,
  latency_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_created (session_id, created_at),
  INDEX idx_module_created (module, created_at),
  CONSTRAINT fk_ai_audit_session FOREIGN KEY (session_id) 
    REFERENCES diagnostic_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
