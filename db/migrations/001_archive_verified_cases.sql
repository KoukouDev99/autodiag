-- Migration 001: Archive orphan verified_cases
-- Base: autodiag_dev
-- Compatible MariaDB 10.4

START TRANSACTION;

-- 1. Création de la table d'archivage miroir
CREATE TABLE IF NOT EXISTS archive_verified_cases (
  id INT PRIMARY KEY,
  session_id INT NOT NULL,
  confirmed_fault_id INT DEFAULT NULL,
  was_correct TINYINT(1) DEFAULT 1,
  user_feedback VARCHAR(50) DEFAULT 'confirmed',
  feedback_notes TEXT,
  symptoms_json JSON,
  vehicle_id INT NOT NULL,
  confidence_initial DECIMAL(5,2) DEFAULT 85.00,
  created_at TIMESTAMP NULL,
  archive_reason VARCHAR(255) DEFAULT 'Orphan session IDs (28-30) and non-existent question 113',
  archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Copie sécurisée des 3 lignes orphelines
INSERT INTO archive_verified_cases (
  id, session_id, confirmed_fault_id, was_correct, user_feedback,
  feedback_notes, symptoms_json, vehicle_id, confidence_initial, created_at
)
SELECT id, session_id, confirmed_fault_id, was_correct, user_feedback,
       feedback_notes, symptoms_json, vehicle_id, confidence_initial, created_at
FROM verified_cases
WHERE session_id IN (28, 29, 30);

-- 3. Suppression des lignes orphelines de la table active
DELETE FROM verified_cases WHERE session_id IN (28, 29, 30);

COMMIT;
