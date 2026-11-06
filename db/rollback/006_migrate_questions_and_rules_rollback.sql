-- Rollback 006: Annulation de la migration des questions, options, règles et solutions
-- Base: autodiag_dev (Compatible MariaDB 10.4)

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Suppression des règles migrées
DELETE FROM diagnostic_rules WHERE id >= 102;

-- 2. Suppression des options migrées
DELETE FROM answer_options WHERE id >= 41;

-- 3. Suppression des questions migrées
DELETE FROM diagnostic_questions WHERE id >= 16;

-- 4. Suppression des mappings questions et options dans legacy_id_map
DELETE FROM legacy_id_map WHERE entity_type IN ('question', 'answer_option');
DELETE FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id <= 19;

-- 4b. Suppression des liaisons fault_symptoms pour symptômes >= 10
DELETE FROM fault_symptoms WHERE symptom_id >= 10;

-- 5. Nettoyage des solutions et tests créés pour les nouvelles pannes
DELETE FROM solutions WHERE id >= 20;
DELETE FROM diagnostic_tests WHERE id >= 20;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;
