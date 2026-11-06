-- Rollback 005: Suppression de legacy_id_map et des 28 pannes créées
-- Base: autodiag_dev (Compatible MariaDB 10.4)

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Suppression des entrées dans legacy_id_map
DROP TABLE IF EXISTS legacy_id_map;

-- 2. Suppression des 28 pannes créées spécifiquement par la migration 005
DELETE FROM faults WHERE code IN (
  'FAULT-BAT-003',
  'FAULT-ALT-002',
  'FAULT-ELC-001',
  'FAULT-SEN-001',
  'FAULT-FUE-002',
  'FAULT-FUE-003',
  'FAULT-FUE-004',
  'FAULT-FUE-005',
  'FAULT-TIM-001',
  'FAULT-TRB-001',
  'FAULT-MNT-001',
  'FAULT-OIL-001',
  'FAULT-OIL-002',
  'FAULT-ENG-001',
  'FAULT-CAT-001',
  'FAULT-O2S-001',
  'FAULT-EVP-001',
  'FAULT-EXH-001',
  'FAULT-MAP-001',
  'FAULT-WIN-001',
  'FAULT-LGT-001',
  'FAULT-WPR-001',
  'FAULT-CLT-001',
  'FAULT-ATX-001',
  'FAULT-AXL-001',
  'FAULT-DIF-001',
  'FAULT-STR-001',
  'FAULT-TPM-001'
);

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;
