-- Rollback 004: Retour arrière garde auto-complétion
-- Base: autodiag_dev
-- Compatible MariaDB 10.4
--
-- Le correctif de la migration 004 est applicatif dans backend/src/routes/diagnostics.js.
-- Ce script SQL vérifie l'état des sessions avec statut 'no_questions_available'.

SELECT COUNT(*) AS sessions_with_no_questions_available
FROM diagnostic_sessions
WHERE status = 'no_questions_available';
