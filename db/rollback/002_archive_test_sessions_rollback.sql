-- Rollback 002: Restauration des 268 sessions de test archivées
-- Base: autodiag_dev
-- Compatible MariaDB 10.4
--
-- RISQUE DE COLLISION D'IDENTIFIANTS (ID COLLISION RISK) :
-- Si de nouvelles sessions ont été créées entre-temps avec AUTO_INCREMENT,
-- réinsérer des IDs archivés peut provoquer des doublons de clé primaire (Duplicate entry for key PRIMARY).
-- Pour sécuriser l'opération sans corrompre les nouvelles sessions :
-- 1. On désactive temporairement les vérifications de clés étrangères (FOREIGN_KEY_CHECKS = 0).
-- 2. On utilise 'INSERT IGNORE' pour ne restaurer que les sessions dont l'ID n'a pas été réattribué.
-- 3. On réactive FOREIGN_KEY_CHECKS à 1 avant le COMMIT.

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- Restauration idempotente avec protection contre les collisions d'ID
INSERT IGNORE INTO diagnostic_sessions (
  id, user_id, vehicle_id, symptom_id, status, current_step,
  summary_title, summary_desc, created_at, completed_at
)
SELECT id, user_id, vehicle_id, symptom_id, status, current_step,
       summary_title, summary_desc, created_at, completed_at
FROM archive_diagnostic_sessions;

-- Suppression de la table d'archive après restauration
DROP TABLE IF EXISTS archive_diagnostic_sessions;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;
