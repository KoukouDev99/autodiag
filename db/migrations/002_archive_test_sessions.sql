-- Migration 002: Archive test sessions without answers (Option B: 268 sessions)
-- Base: autodiag_dev
-- Compatible MariaDB 10.4

START TRANSACTION;

-- 1. Table d'archivage miroir avec horodatage et motif
CREATE TABLE IF NOT EXISTS archive_diagnostic_sessions (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  symptom_id INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  current_step INT NOT NULL,
  summary_title VARCHAR(255),
  summary_desc TEXT,
  created_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  archive_reason VARCHAR(255) DEFAULT 'Test session without answers (Option B purge)',
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Copie conforme des 268 sessions ciblées
INSERT INTO archive_diagnostic_sessions (
  id, user_id, vehicle_id, symptom_id, status, current_step,
  summary_title, summary_desc, created_at, completed_at
)
SELECT id, user_id, vehicle_id, symptom_id, status, current_step,
       summary_title, summary_desc, created_at, completed_at
FROM diagnostic_sessions
WHERE id NOT IN (SELECT DISTINCT session_id FROM session_answers)
  AND created_at < '2026-10-15 19:30:00'
  AND user_id IN (1, 2);

-- 3. Suppression sécurisée uniquement des sessions archivées
DELETE FROM diagnostic_sessions
WHERE id NOT IN (SELECT DISTINCT session_id FROM session_answers)
  AND created_at < '2026-10-15 19:30:00'
  AND user_id IN (1, 2);

COMMIT;
