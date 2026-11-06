-- Rollback 003: Retour arrière correctif seed
-- Base: autodiag_dev
-- Compatible MariaDB 10.4
--
-- Le correctif de la migration 003 est applicatif (suppression d'une instruction destructrice dans seed_diagnostic_structure.js).
-- Ce rollback SQL confirme qu'aucune altération de données n'a été causée.

SELECT 'Rollback 003: Aucune modification de structure à inverser. Rétablir l'instruction dans seed_diagnostic_structure.js si requis.' AS notice;
