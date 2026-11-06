-- Migration 003: Correctif intégrité du seed de connaissances (Knowledge Seed Integrity Guard)
-- Base: autodiag_dev
-- Compatible MariaDB 10.4
-- 
-- CONTEXTE & OBJECTIF :
-- Le script `backend/src/db/seed_diagnostic_structure.js:L805` exécutait :
--   DELETE FROM session_answers WHERE session_id IN (SELECT id FROM diagnostic_sessions WHERE symptom_id <= 9);
-- Cette requête supprimait les réponses utilisateur sans supprimer les sessions parentes,
-- provoquant l'apparition de sessions orphelines avec status = 'completed' et 0 réponses.
--
-- ACTION RÉALISÉE :
-- 1. Suppression du DELETE sauvage dans le code de seed.
-- 2. Audit SQL de vérification : s'assurer qu'aucune session 'completed' ne reste orpheline de réponses (hors historique avant migration 002).

SELECT COUNT(*) AS orphaned_completed_sessions_count
FROM diagnostic_sessions
WHERE status = 'completed'
  AND id NOT IN (SELECT DISTINCT session_id FROM session_answers)
  AND id NOT IN (96, 97, 162, 163);
