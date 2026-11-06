-- Migration 005: Création de legacy_id_map et standardisation des 39 hypothèses
-- Base: autodiag_dev (Compatible MariaDB 10.4)
-- Date: 2026-10-15

START TRANSACTION;

-- 1. Table de correspondance des identifiants historiques vers le moteur unifié
CREATE TABLE IF NOT EXISTS legacy_id_map (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  old_id INT NOT NULL,
  new_id INT NOT NULL,
  legacy_name VARCHAR(255),
  notes VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_legacy_entity (entity_type, old_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insertion des 28 nouvelles pannes standardisées dans 'faults'
INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-BAT-003', 'Batterie en fin de vie chimique (> 4 ans)', 'batterie en fin de vie chimique (> 4 ans)', 'Démarrage / Électrique', 'Électrique', 'Les plaques de plomb sont sulfat??es et ne retiennent plus la charge r??siduelle.', 'Panne al??atoire au premier coup de froid', 'medium', 90, 220, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-ALT-002', 'Régulateur ou charbons d''alternateur HS', 'regulateur ou charbons d''alternateur hs', 'Électrique / Charge', 'Électrique', 'La g??n??ratrice ne fournit plus les 14 Volts n??cessaires pour recharger la batterie et alimenter les phares et calculateurs.', 'Panne d''??lectricit?? totale en moins de 30 minutes de route', 'high', 280, 580, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-ELC-001', 'Consommateur parasite à l''arrêt (Fuite de courant)', 'consommateur parasite a l''arret (fuite de courant)', 'Électrique / Circuit', 'Électrique', 'Une ampoule de coffre ou de bo??te ?? gants reste allum??e, ou un bo??tier ??lectronique ne se met pas en veille.', 'Batterie vid??e ?? chaque stationnement prolong??', 'medium', 50, 150, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-SEN-001', 'Sonde lambda ou débitmètre d''air décalé', 'sonde lambda ou debitmetre d''air decale', 'Alimentation / Échappement', 'Moteur', 'Le calculateur re??oit une fausse mesure de masse d''air et enrichit excessivement le m??lange en permanence.', 'Encrassement de la chambre de combustion ?? Pollution', 'medium', 120, 280, 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-FUE-002', 'Régulateur de pression de carburant défaillant', 'regulateur de pression de carburant defaillant', 'Alimentation / Carburant', 'Moteur', 'Failure in Fuel Pressure Regulator matches observed symptoms: Engine stalls, Black smoke from exhaust, Hard starting hot, Fuel odor in vacuum line.', 'High ?? Immediate Repair', 'high', 65, 190, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-FUE-003', 'Pompe à carburant électrique immergée HS', 'pompe a carburant electrique immergee hs', 'Alimentation / Carburant', 'Moteur', 'Failure in Electric Fuel Pump matches observed symptoms: Engine sputters at high speeds, Loss of power under load, Car cranks but will not start, High-pitched whine from gas tank.', 'Critical ?? Stop Driving', 'critical', 160, 450, 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-FUE-004', 'Fuite réservoir ou goulotte de remplissage', 'fuite reservoir ou goulotte de remplissage', 'Alimentation / Carburant', 'Sécurité', 'Failure in Fuel Tank & Filler Neck matches observed symptoms: Fuel odor inside vehicle, Visible fuel leak under vehicle after fill-up, Hissing sound when opening gas cap.', 'Critical ?? Stop Driving', 'critical', 110, 420, 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-FUE-005', 'Filtre à carburant colmaté ou saturé d''eau', 'filtre a carburant colmate ou sature d''eau', 'Alimentation / Carburant', 'Moteur', 'Failure in Fuel Filter matches observed symptoms: Engine stalls at high speeds, Poor acceleration, Engine hesitates under heavy load, Extended cranking before start.', 'Moderate ?? Inspection Required', 'medium', 30, 95, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-TIM-001', 'Courroie ou chaîne de distribution décalée / usée', 'courroie ou chaine de distribution decalee / usee', 'Distribution / Moteur', 'Moteur', 'Failure in Timing Belt & Synchronization matches observed symptoms: Engine misfires, Engine won''t start, High-pitched slapping noise under timing cover, Fast spinning starter without compression.', 'Critical ?? Stop Driving', 'critical', 350, 850, 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-TRB-001', 'Turbocompresseur grippé ou perte de pression de suralimentation', 'turbocompresseur grippe ou perte de pression de suralimentation', 'Suralimentation / Moteur', 'Moteur', 'Failure in Turbocharger & Boost Pressure matches observed symptoms: Loss of engine power, Severe turbo lag, High-pitched whistling or dentist-drill sound, Black smoke on acceleration.', 'High ?? Immediate Repair', 'high', 350, 1200, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-MNT-001', 'Silentblocs support moteur ou boîte de vitesses affaissés', 'silentblocs support moteur ou boite de vitesses affaisses', 'Châssis / Moteur', 'Mécanique', 'Failure in Engine & Transmission Mounts matches observed symptoms: Excessive engine movement / rocking, Clunking noise when accelerating or shifting gears, Vibrations felt in cabin at idle.', 'Moderate ?? Inspection Required', 'medium', 90, 280, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-OIL-001', 'Joint de couvre-culasse fuyard (Fuite d''huile)', 'joint de couvre-culasse fuyard (fuite d''huile)', 'Lubrification / Moteur', 'Moteur', 'Failure in Valve Cover Gasket matches observed symptoms: Oil leak around valve cover, Burning oil smell from engine bay, Oil pooling in spark plug wells, Engine misfire.', 'Moderate ?? Inspection Required', 'medium', 55, 180, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-OIL-002', 'Pompe à huile défaillante ou crépine colmatée', 'pompe a huile defaillante ou crepine colmatee', 'Lubrification / Moteur', 'Moteur', 'Failure in Engine Oil Pump & Pressure matches observed symptoms: Low oil pressure warning light on, Engine knocking or ticking noise, Loud hydraulic lifter clatter at idle.', 'Critical ?? Stop Driving', 'critical', 350, 950, 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-ENG-001', 'Segmentation usée ou perte de compression cylindres', 'segmentation usee ou perte de compression cylindres', 'Moteur thermique', 'Moteur', 'Failure in Piston Rings & Compression matches observed symptoms: Blue smoke from exhaust under acceleration, High oil consumption (1L / 1000km), Loss of engine power, Excessive crankcase blow-by.', 'High ?? Immediate Repair', 'high', 650, 1800, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-CAT-001', 'Catalyseur colmaté ou fondu', 'catalyseur colmate ou fondu', 'Échappement / Antipollution', 'Moteur', 'Failure in Catalytic Converter matches observed symptoms: Rotten egg / sulfur smell from exhaust, Check engine light on (P0420 / P0430), Sluggish acceleration / top speed limited, Rattling noise under car.', 'High ?? Immediate Repair', 'high', 350, 950, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-O2S-001', 'Sonde à oxygène amont/aval hors tolérance (P0130)', 'sonde a oxygene amont/aval hors tolerance (p0130)', 'Antipollution / Électronique', 'Électronique', 'Failure in Oxygen Sensor (Lambda Sonde) matches observed symptoms: Check engine light on (P0130 - P0167), Poor fuel economy (+20% consumption), Black exhaust soot, Rough idle / engine stumbling.', 'Moderate ?? Inspection Required', 'medium', 75, 220, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-EVP-001', 'Électrovanne de purge canister EVAP bloquée (P0441)', 'electrovanne de purge canister evap bloquee (p0441)', 'Antipollution / Carburant', 'Électronique', 'Failure in EVAP Canister Purge Valve matches observed symptoms: Check engine light on (P0441 / P0444), Rough idle / stalling right after refueling at gas station, Fuel odor around car.', 'Low ?? Maintenance Item', 'low', 35, 120, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-EXH-001', 'Collecteur d''échappement fissuré ou joint brûlé', 'collecteur d''echappement fissure ou joint brule', 'Échappement', 'Mécanique', 'Failure in Exhaust Manifold & Gasket matches observed symptoms: Loud ticking or puffing exhaust noise on cold start, Exhaust smell inside cabin, Noise quiets down as engine warms up, Visible black soot around cylinder head ports.', 'Moderate ?? Inspection Required', 'medium', 110, 380, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-MAP-001', 'Capteur de pression absolue tubulure d''admission (MAP) défectueux', 'capteur de pression absolue tubulure d''admission (map) defectueux', 'Admission / Injection', 'Électronique', 'Failure in Manifold Absolute Pressure (M.A.P.) Sensor matches observed symptoms: Check engine light on (P0105 - P0109), Rough erratic idle, Black smoke / fuel rich mixture, Hesitation when pressing accelerator.', 'Moderate ?? Inspection Required', 'medium', 45, 140, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-WIN-001', 'Moteur ou tringlerie de lève-vitre électrique défaillant', 'moteur ou tringlerie de leve-vitre electrique defaillant', 'Habitacle / Confort', 'Électrique', 'Failure in Power Window Motor & Regulator matches observed symptoms: Window does not move, Window moves intermittently, Grinding or crunching sound inside door, Window dropped inside door panel.', 'Low ?? Maintenance Item', 'low', 80, 240, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-LGT-001', 'Ampoule de projecteur grillée ou connecteur brûlé', 'ampoule de projecteur grillee ou connecteur brule', 'Éclairage / Visibilité', 'Sécurité', 'Failure in Headlamp Bulb & Socket matches observed symptoms: Headlight not working on one side, Dim headlight, Bulb blows repeatedly, Flickering headlight over bumps.', 'High ?? Immediate Repair', 'high', 12, 65, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-WPR-001', 'Moteur ou tringlerie d''essuie-glace bloqué', 'moteur ou tringlerie d''essuie-glace bloque', 'Visibilité / Sécurité', 'Sécurité', 'Failure in Windshield Wiper Motor & Linkage matches observed symptoms: Wipers not working at all, Wipers operate intermittently or stop mid-windshield, Motor whines but blades don''t sweep.', 'Critical ?? Stop Driving', 'critical', 75, 240, 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-CLT-001', 'Émetteur ou récepteur hydraulique d''embrayage fuyard', 'emetteur ou recepteur hydraulique d''embrayage fuyard', 'Transmission / Embrayage', 'Mécanique', 'Failure in Clutch Master & Slave Cylinder matches observed symptoms: Clutch pedal feels spongy or stays on floor, Fluid leak near clutch pedal inside car, Difficulty engaging 1st and reverse gears, Clutch dragging.', 'High ?? Immediate Repair', 'high', 110, 320, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-ATX-001', 'Boîte de vitesses automatique dégradée (Huile ATF usée ou patinage)', 'boite de vitesses automatique degradee (huile atf usee ou patinage)', 'Transmission', 'Mécanique', 'Failure in Automatic Transmission (Fluid & Filter) matches observed symptoms: Transmission slipping (engine revs but car doesn''t accelerate), Delay in gear engagement into Drive/Reverse, Harsh jerky shifts, Transmission overheating warning.', 'High ?? Immediate Repair', 'high', 150, 380, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-AXL-001', 'Cardan, arbre de transmission ou croisillon usé avec jeu', 'cardan, arbre de transmission ou croisillon use avec jeu', 'Transmission / Train roulant', 'Mécanique', 'Failure in Driveshaft, CV Axle & Universal Joint matches observed symptoms: Driveline vibration through floorboard at 80-110 km/h, Clunking noise when shifting from Drive to Reverse, Clicking noise when turning sharp corners.', 'High ?? Immediate Repair', 'high', 120, 380, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-DIF-001', 'Différentiel ou pont arrière bruyant (Jeu pignon / couronne)', 'differentiel ou pont arriere bruyant (jeu pignon / couronne)', 'Transmission', 'Mécanique', 'Failure in Differential & Bevel Gears matches observed symptoms: Whining noise from rear end under acceleration, Vehicle vibration at high speeds, Clunking when accelerating/decelerating, Binding during sharp turns.', 'High ?? Immediate Repair', 'high', 250, 750, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-STR-001', 'Pompe de direction assistée défaillante ou manque de fluide', 'pompe de direction assistee defaillante ou manque de fluide', 'Direction', 'Sécurité', 'Failure in Power Steering Pump & Fluid matches observed symptoms: Whining / groaning noise when turning steering wheel, Stiff heavy steering wheel, Fluid leak under front of engine, Foamy fluid in reservoir.', 'High ?? Immediate Repair', 'high', 80, 340, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger, source_record_id)
VALUES ('FAULT-TPM-001', 'Capteur de pression de pneu TPMS en panne (Pile ou capteur)', 'capteur de pression de pneu tpms en panne (pile ou capteur)', 'Sécurité / Pneumatiques', 'Électronique', 'Failure in Tire Pressure Monitoring System (TPMS) matches observed symptoms: TPMS warning light on dashboard, Low tire pressure symbol flashing for 60s then solid, Uneven tire wear, Vehicle pulling to one side.', 'Moderate ?? Inspection Required', 'medium', 35, 95, 0, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 3. Peuplement de legacy_id_map pour les 11 pannes existantes réutilisées
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 23, id, 'Fusible de protection grill?? sur le circuit', 'Reused existing fault FAULT-FUS-001'
FROM faults WHERE code = 'FAULT-FUS-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 24, id, 'Faisceau coup?? dans le soufflet de porti??re / hayon', 'Reused existing fault FAULT-WRG-001'
FROM faults WHERE code = 'FAULT-WRG-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 25, id, 'Filtre ?? air tr??s encrass?? ou ??touff??', 'Reused existing fault FAULT-AIR-001'
FROM faults WHERE code = 'FAULT-AIR-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 27, id, 'Sous-gonflage des pneus ou ??trier de frein qui frotte', 'Reused existing fault FAULT-TYR-001'
FROM faults WHERE code = 'FAULT-TYR-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 33, id, 'Drive Accessory / Serpentine Belt', 'Reused existing fault FAULT-BELT-001'
FROM faults WHERE code = 'FAULT-BELT-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 35, id, 'Diesel Glow Plugs', 'Reused existing fault FAULT-GLW-001'
FROM faults WHERE code = 'FAULT-GLW-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 45, id, '12V Battery & Terminals', 'Reused existing fault FAULT-BAT-001'
FROM faults WHERE code = 'FAULT-BAT-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 46, id, 'Alternator & Charging System', 'Reused existing fault FAULT-ALT-001'
FROM faults WHERE code = 'FAULT-ALT-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 47, id, 'Starter Motor & Solenoid', 'Reused existing fault FAULT-STA-001'
FROM faults WHERE code = 'FAULT-STA-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 48, id, 'Ignition System (Wires, Cap & Coils)', 'Reused existing fault FAULT-IGN-001'
FROM faults WHERE code = 'FAULT-IGN-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 57, id, 'Wheel Bearing & Hub', 'Reused existing fault FAULT-WHL-001'
FROM faults WHERE code = 'FAULT-WHL-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);

-- 4. Peuplement de legacy_id_map pour les 28 nouvelles pannes créées
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 20, id, 'Batterie en fin de vie chimique (> 4 ans)', 'Created new fault FAULT-BAT-003'
FROM faults WHERE code = 'FAULT-BAT-003'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 21, id, 'Alternateur hors service (R??gulateur ou charbons)', 'Created new fault FAULT-ALT-002'
FROM faults WHERE code = 'FAULT-ALT-002'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 22, id, 'Consommateur parasite ?? l''arr??t (Fuite de courant)', 'Created new fault FAULT-ELC-001'
FROM faults WHERE code = 'FAULT-ELC-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 26, id, 'Sonde lambda ou d??bitm??tre d''air d??cal??', 'Created new fault FAULT-SEN-001'
FROM faults WHERE code = 'FAULT-SEN-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 28, id, 'Fuel Pressure Regulator', 'Created new fault FAULT-FUE-002'
FROM faults WHERE code = 'FAULT-FUE-002'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 29, id, 'Electric Fuel Pump', 'Created new fault FAULT-FUE-003'
FROM faults WHERE code = 'FAULT-FUE-003'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 30, id, 'Fuel Tank & Filler Neck', 'Created new fault FAULT-FUE-004'
FROM faults WHERE code = 'FAULT-FUE-004'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 31, id, 'Fuel Filter', 'Created new fault FAULT-FUE-005'
FROM faults WHERE code = 'FAULT-FUE-005'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 32, id, 'Timing Belt & Synchronization', 'Created new fault FAULT-TIM-001'
FROM faults WHERE code = 'FAULT-TIM-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 34, id, 'Turbocharger & Boost Pressure', 'Created new fault FAULT-TRB-001'
FROM faults WHERE code = 'FAULT-TRB-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 36, id, 'Engine & Transmission Mounts', 'Created new fault FAULT-MNT-001'
FROM faults WHERE code = 'FAULT-MNT-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 37, id, 'Valve Cover Gasket', 'Created new fault FAULT-OIL-001'
FROM faults WHERE code = 'FAULT-OIL-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 38, id, 'Engine Oil Pump & Pressure', 'Created new fault FAULT-OIL-002'
FROM faults WHERE code = 'FAULT-OIL-002'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 39, id, 'Piston Rings & Compression', 'Created new fault FAULT-ENG-001'
FROM faults WHERE code = 'FAULT-ENG-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 40, id, 'Catalytic Converter', 'Created new fault FAULT-CAT-001'
FROM faults WHERE code = 'FAULT-CAT-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 41, id, 'Oxygen Sensor (Lambda Sonde)', 'Created new fault FAULT-O2S-001'
FROM faults WHERE code = 'FAULT-O2S-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 42, id, 'EVAP Canister Purge Valve', 'Created new fault FAULT-EVP-001'
FROM faults WHERE code = 'FAULT-EVP-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 43, id, 'Exhaust Manifold & Gasket', 'Created new fault FAULT-EXH-001'
FROM faults WHERE code = 'FAULT-EXH-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 44, id, 'Manifold Absolute Pressure (M.A.P.) Sensor', 'Created new fault FAULT-MAP-001'
FROM faults WHERE code = 'FAULT-MAP-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 49, id, 'Power Window Motor & Regulator', 'Created new fault FAULT-WIN-001'
FROM faults WHERE code = 'FAULT-WIN-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 50, id, 'Headlamp Bulb & Socket', 'Created new fault FAULT-LGT-001'
FROM faults WHERE code = 'FAULT-LGT-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 51, id, 'Windshield Wiper Motor & Linkage', 'Created new fault FAULT-WPR-001'
FROM faults WHERE code = 'FAULT-WPR-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 52, id, 'Clutch Master & Slave Cylinder', 'Created new fault FAULT-CLT-001'
FROM faults WHERE code = 'FAULT-CLT-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 53, id, 'Automatic Transmission (Fluid & Filter)', 'Created new fault FAULT-ATX-001'
FROM faults WHERE code = 'FAULT-ATX-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 54, id, 'Driveshaft, CV Axle & Universal Joint', 'Created new fault FAULT-AXL-001'
FROM faults WHERE code = 'FAULT-AXL-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 55, id, 'Differential & Bevel Gears', 'Created new fault FAULT-DIF-001'
FROM faults WHERE code = 'FAULT-DIF-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 56, id, 'Power Steering Pump & Fluid', 'Created new fault FAULT-STR-001'
FROM faults WHERE code = 'FAULT-STR-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', 58, id, 'Tire Pressure Monitoring System (TPMS)', 'Created new fault FAULT-TPM-001'
FROM faults WHERE code = 'FAULT-TPM-001'
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id), notes = VALUES(notes);

COMMIT;
