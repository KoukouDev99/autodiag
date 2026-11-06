-- Rollback 007: Annulation des contraintes Phase 3 et restauration des noms de tables legacy
-- Base: autodiag_dev (Compatible MariaDB 10.4)

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Restauration des noms de tables historiques
RENAME TABLE legacy_questions TO questions,
             legacy_question_options TO question_options,
             legacy_hypotheses TO hypotheses,
             legacy_repair_guides TO repair_guides,
             legacy_repair_steps TO repair_steps;

-- 2. Suppression de la table diagnostic_results
DROP TABLE IF EXISTS diagnostic_results;

-- 3. Suppression des clés étrangères de verified_cases
ALTER TABLE verified_cases
  DROP FOREIGN KEY fk_vc_session,
  DROP FOREIGN KEY fk_vc_fault,
  DROP FOREIGN KEY fk_vc_vehicle;

-- 4. Suppression des clés étrangères et de la contrainte UNIQUE sur session_answers
ALTER TABLE session_answers
  DROP FOREIGN KEY fk_sa_session,
  DROP FOREIGN KEY fk_sa_question,
  DROP FOREIGN KEY fk_sa_option,
  DROP KEY uk_session_question;

-- 5. Restauration des anciens IDs de questions/options dans session_answers
UPDATE session_answers SET question_id = 126, option_id = 272 WHERE question_id = 1 AND option_id = 1;
UPDATE session_answers SET question_id = 126, option_id = 273 WHERE question_id = 1 AND option_id = 2;
UPDATE session_answers SET question_id = 127, option_id = 276 WHERE question_id = 2 AND option_id = 5;
UPDATE session_answers SET question_id = 127, option_id = 277 WHERE question_id = 2 AND option_id = 6;
UPDATE session_answers SET question_id = 128, option_id = 281 WHERE question_id = 3 AND option_id = 8;
UPDATE session_answers SET question_id = 129, option_id = 283 WHERE question_id = 4 AND option_id = 13;
UPDATE session_answers SET question_id = 130, option_id = 286 WHERE question_id = 5 AND option_id = 17;
UPDATE session_answers SET question_id = 132, option_id = 296 WHERE question_id = 6 AND option_id = 18;

-- 6. Annulation de la complétude de fault_symptoms
DELETE FROM fault_symptoms WHERE symptom_id BETWEEN 10 AND 25 AND relevance_score = 80;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;
