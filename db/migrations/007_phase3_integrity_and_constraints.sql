-- Migration 007: Intégrité référentielle, contraintes et table diagnostic_results (Phase 3)
-- Base: autodiag_dev (Compatible MariaDB 10.4)
-- Date: 2026-10-15

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Harmonisation des 14 anciennes réponses dans session_answers vers le modèle unifié
UPDATE session_answers SET question_id = 1, option_id = 1 WHERE option_id = 272;
UPDATE session_answers SET question_id = 1, option_id = 2 WHERE option_id = 273;
UPDATE session_answers SET question_id = 2, option_id = 5 WHERE option_id = 276;
UPDATE session_answers SET question_id = 2, option_id = 6 WHERE option_id = 277;
UPDATE session_answers SET question_id = 3, option_id = 8 WHERE option_id = 281;
UPDATE session_answers SET question_id = 4, option_id = 13 WHERE option_id = 283;
UPDATE session_answers SET question_id = 5, option_id = 17 WHERE option_id = 286;
UPDATE session_answers SET question_id = 6, option_id = 18 WHERE option_id = 296;

-- 2. Nettoyage de tout éventuel doublon (session_id, question_id) avant création de la contrainte UNIQUE
DELETE sa1 FROM session_answers sa1
INNER JOIN session_answers sa2 
WHERE sa1.id < sa2.id 
  AND sa1.session_id = sa2.session_id 
  AND sa1.question_id = sa2.question_id;

-- 2b. Complétude de fault_symptoms pour les 16 symptômes historiques (10 à 25)
INSERT IGNORE INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary)
SELECT m.new_id, h.symptom_id, 80, 1
FROM hypotheses h
JOIN legacy_id_map m ON m.entity_type = 'hypothesis' AND m.old_id = h.id
WHERE h.symptom_id BETWEEN 10 AND 25;

-- 3. Clés étrangères & Contrainte d'unicité sur session_answers
ALTER TABLE session_answers
  ADD CONSTRAINT fk_sa_session FOREIGN KEY (session_id) REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_sa_question FOREIGN KEY (question_id) REFERENCES diagnostic_questions(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_sa_option FOREIGN KEY (option_id) REFERENCES answer_options(id) ON DELETE CASCADE,
  ADD UNIQUE KEY uk_session_question (session_id, question_id);

-- 4. Clés étrangères sur verified_cases
ALTER TABLE verified_cases
  ADD CONSTRAINT fk_vc_session FOREIGN KEY (session_id) REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_vc_fault FOREIGN KEY (confirmed_fault_id) REFERENCES faults(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_vc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

-- 5. Création de la table diagnostic_results
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  fault_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  `rank` INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_dr_session (session_id),
  KEY idx_dr_fault (fault_id),
  CONSTRAINT fk_dr_session FOREIGN KEY (session_id) REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_dr_fault FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Renommage des tables legacy en legacy_*
RENAME TABLE questions TO legacy_questions,
             question_options TO legacy_question_options,
             hypotheses TO legacy_hypotheses,
             repair_guides TO legacy_repair_guides,
             repair_steps TO legacy_repair_steps;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;
