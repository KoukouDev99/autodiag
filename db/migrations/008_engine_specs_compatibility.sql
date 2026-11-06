-- Migration 008: Spécifications motorisations, indexation et compatibilités fault_vehicles (Phase 4b)
-- Base: autodiag_dev (Compatible MariaDB 10.4)
-- Date: 2026-10-15

START TRANSACTION;

SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Indexation pour la recherche de motorisations dans car_specs_engines
ALTER TABLE car_specs_engines
  ADD INDEX idx_name (name);

-- 2. Évolution de fault_vehicles : ajout de evidence_level et source_record_id
ALTER TABLE fault_vehicles
  ADD COLUMN evidence_level VARCHAR(50) NOT NULL DEFAULT 'verified',
  ADD COLUMN source_record_id INT DEFAULT NULL,
  ADD CONSTRAINT fk_fv_source FOREIGN KEY (source_record_id) REFERENCES source_records(id) ON DELETE SET NULL;

-- 3. Ajout de la règle de compatibilité PureTech (Courroie humide & Crépine)
-- Conformément aux exigences strictes : evidence_level = 'unverified', source_record_id = NULL, avec un TODO explicite.
INSERT INTO fault_vehicles (id, fault_id, make, model, fuel_type, engine_code, year_start, year_end, mileage_min, compatibility, notes, evidence_level, source_record_id)
VALUES 
  (23, 310, 'Peugeot', NULL, 'Essence', '1.2 PureTech', 2012, 2023, 60000, 'frequent', 'TODO: Source technique requise (RTA/Stellantis TSB). Non vérifié formellement.', 'unverified', NULL),
  (24, 314, 'Peugeot', NULL, 'Essence', '1.2 PureTech', 2012, 2023, 60000, 'frequent', 'TODO: Source technique requise (résidus de courroie dans crépine d''huile). Non vérifié formellement.', 'unverified', NULL),
  (25, 310, 'Citroen', NULL, 'Essence', '1.2 PureTech', 2012, 2023, 60000, 'frequent', 'TODO: Source technique requise (RTA/Stellantis TSB). Non vérifié formellement.', 'unverified', NULL),
  (26, 314, 'Citroen', NULL, 'Essence', '1.2 PureTech', 2012, 2023, 60000, 'frequent', 'TODO: Source technique requise (résidus de courroie dans crépine d''huile). Non vérifié formellement.', 'unverified', NULL)
ON DUPLICATE KEY UPDATE 
  notes = VALUES(notes),
  evidence_level = VALUES(evidence_level);

-- 4. Règles de compatibilité physique pour les pannes standardisées restantes
INSERT INTO fault_vehicles (id, fault_id, make, model, fuel_type, engine_code, year_start, year_end, mileage_min, compatibility, notes, evidence_level, source_record_id)
VALUES
  -- Électrovanne de purge canister EVAP (spécifique Essence, inexistante sur Diesel)
  (27, 318, NULL, NULL, 'Diesel', NULL, NULL, NULL, 0, 'incompatible', 'Circuits EVAP canister réservés aux vapeurs d''essence, absents sur Diesel.', 'verified', NULL),
  -- Embrayage hydraulique (absent sur véhicules 100% électriques)
  (28, 324, NULL, NULL, 'Électrique', NULL, NULL, NULL, 0, 'incompatible', 'Véhicules électriques dépourvus d''embrayage mécanique/hydraulique.', 'verified', NULL)
ON DUPLICATE KEY UPDATE 
  notes = VALUES(notes),
  evidence_level = VALUES(evidence_level);

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

COMMIT;
