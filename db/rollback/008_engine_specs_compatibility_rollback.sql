-- Rollback 008: Annulation des spécifications motorisations et règles fault_vehicles
-- Base: autodiag_dev (Compatible MariaDB 10.4)

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Suppression des règles ajoutées dans fault_vehicles
DELETE FROM fault_vehicles WHERE id >= 23;

-- 2. Suppression de la clé étrangère et des colonnes de traçabilité dans fault_vehicles
ALTER TABLE fault_vehicles
  DROP FOREIGN KEY fk_fv_source,
  DROP COLUMN evidence_level,
  DROP COLUMN source_record_id;

-- 3. Suppression de l'index sur car_specs_engines
ALTER TABLE car_specs_engines
  DROP INDEX idx_name;

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;
