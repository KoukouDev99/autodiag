-- Rollback 001: Restauration des verified_cases archivés
-- Base: autodiag_dev
-- Compatible MariaDB 10.4

START TRANSACTION;

-- 1. Réinsertion dans verified_cases
INSERT INTO verified_cases (
  id, session_id, confirmed_fault_id, was_correct, user_feedback,
  feedback_notes, symptoms_json, vehicle_id, confidence_initial, created_at
)
SELECT id, session_id, confirmed_fault_id, was_correct, user_feedback,
       feedback_notes, symptoms_json, vehicle_id, confidence_initial, created_at
FROM archive_verified_cases
WHERE id IN (1, 2, 3);

-- 2. Suppression de la table d'archive
DROP TABLE IF EXISTS archive_verified_cases;

COMMIT;
