-- Migration 004: Garde-fou d'auto-complétion (Auto-complete Guard)
-- Base: autodiag_dev
-- Compatible MariaDB 10.4
--
-- CONTEXTE & OBJECTIF :
-- Dans `backend/src/routes/diagnostics.js:L271`, si aucune question n'était disponible
-- pour un symptôme, la session était immédiatement marquée `status = 'completed'`
-- avec 0 réponses répondues (`answers.length === 0`).
--
-- ACTION RÉALISÉE :
-- 1. Modification applicative : ne passer à 'completed' QUE si answers.length >= 1.
-- 2. Nouveau statut explicite 'no_questions_available' pour les symptômes sans question.
-- 3. Validation de conformité schéma : la colonne diagnostic_sessions.status est de type VARCHAR(40),
--    ce qui supporte nativement 'no_questions_available' sans altération de DDL.

SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'autodiag_dev'
  AND TABLE_NAME = 'diagnostic_sessions'
  AND COLUMN_NAME = 'status';
