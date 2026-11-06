-- Migration 006: Migration unifiée des questions, options, règles et solutions
-- Base: autodiag_dev (Compatible MariaDB 10.4)
-- Date: 2026-10-15

START TRANSACTION;

-- 1. Compléter legacy_id_map pour les hypothèses 1 à 19
INSERT IGNORE INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
SELECT 'hypothesis', id, id, name, 'Direct 1:1 legacy match'
FROM hypotheses WHERE id <= 19;

-- 2. Insertion des 110 questions (symptômes 10 à 64) dans diagnostic_questions
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (16, 10, 1, 'ABS & Braking System', 'Check the ABS Fuse in the Engine Bay Box', 'Locate the ABS / ESP fuse in the fuse diagram and pull it with plastic tweezers to check the internal metal link.', 'ABS failure may cause wheels to lock up during emergency braking. Drive with caution.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 3, 16, 'Check the ABS Fuse in the Engine Bay Box', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (17, 10, 2, 'ABS & Braking System', 'Inspect Wiring Harness and Connector to ABS Module', 'Examine the multi-pin connector on the hydraulic control unit for loose pins, water ingress or chafed cables.', 'ABS failure may cause wheels to lock up during emergency braking. Drive with caution.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 4, 17, 'Inspect Wiring Harness and Connector to ABS Module', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (18, 11, 1, 'ABS & Braking System', 'Inspect Wheel Speed Sensor Connectors in Wheel Wells', 'Check the electrical connector behind the wheel liner for loose locking clips or severed wires from road debris.', 'Avoid sudden aggressive maneuvers on wet surfaces while the ABS light remains active.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 5, 18, 'Inspect Wheel Speed Sensor Connectors in Wheel Wells', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (19, 11, 2, 'ABS & Braking System', 'Check Sensor Tip & Reluctor Ring for Metal Debris or Cracks', 'Look at the magnetic pickup tip and the toothed tone ring on the wheel hub or CV joint.', 'Avoid sudden aggressive maneuvers on wet surfaces while the ABS light remains active.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 6, 19, 'Check Sensor Tip & Reluctor Ring for Metal Debris or Cracks', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (20, 12, 1, 'ABS & Braking System', 'Check Brake Booster Vacuum Hose and One-Way Check Valve', 'Inspect the thick rubber vacuum hose connecting the engine intake manifold or vacuum pump to the brake booster.', 'A failing brake booster dramatically increases stopping distance. Do not drive on public roads.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 7, 20, 'Check Brake Booster Vacuum Hose and One-Way Check Valve', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (21, 12, 2, 'ABS & Braking System', 'Pump Brake Pedal with Engine Off then Start Engine', 'Pump the brake pedal 5 times with engine off until firm, hold pedal down, and start the engine.', 'A failing brake booster dramatically increases stopping distance. Do not drive on public roads.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 8, 21, 'Pump Brake Pedal with Engine Off then Start Engine', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (22, 13, 1, 'ABS & Braking System', 'Inspect Brake Caliper Body and Piston Dust Boot for Fluid', 'Look through wheel spokes or behind wheel for wet oily residue around the caliper piston boot and bleed screw.', 'A seized dragging caliper causes extreme brake overheating, rotor warping, and fluid boil vapor lock.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 9, 22, 'Inspect Brake Caliper Body and Piston Dust Boot for Fluid', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (23, 13, 2, 'ABS & Braking System', 'Check Piston & Guide Slide Pin Freedom of Movement', 'Jack up wheel and rotate by hand, apply brake pedal, release and check if wheel spins freely again.', 'A seized dragging caliper causes extreme brake overheating, rotor warping, and fluid boil vapor lock.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 10, 23, 'Check Piston & Guide Slide Pin Freedom of Movement', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (24, 14, 1, 'ABS & Braking System', 'Visual & Flex Inspection of Rubber Brake Hoses', 'Turn steering wheel to full lock and bend rubber hose gently to inspect for deep dry-rot cracking or damp spots.', 'A ruptured brake hose results in immediate loss of primary hydraulic braking.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 11, 24, 'Visual & Flex Inspection of Rubber Brake Hoses', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (25, 14, 2, 'ABS & Braking System', 'Inspect Hose Expansion Under Heavy Pedal Pressure', 'Have a helper press the brake pedal hard while you observe the flexible hose.', 'A ruptured brake hose results in immediate loss of primary hydraulic braking.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 12, 25, 'Inspect Hose Expansion Under Heavy Pedal Pressure', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (26, 15, 1, 'ABS & Braking System', 'Check Brake Fluid Reservoir Level & Color', 'Examine clear reservoir on driver side firewall. Level should be between MIN and MAX.', 'An internal piston cup bypass causes sudden complete loss of brake pressure while stopped.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 13, 26, 'Check Brake Fluid Reservoir Level & Color', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (27, 15, 2, 'ABS & Braking System', 'Inspect Rear Seal and Hold Constant Pedal Force', 'Check between master cylinder flange and booster for fluid drops, and hold steady medium pressure on pedal for 30s.', 'An internal piston cup bypass causes sudden complete loss of brake pressure while stopped.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 14, 27, 'Inspect Rear Seal and Hold Constant Pedal Force', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (28, 16, 1, 'ABS & Braking System', 'Measure Remaining Brake Pad Friction Lining', 'Use a pad thickness gauge or flashlight through wheel rim to inspect inner and outer friction material.', 'Worn out pads grinding metal-on-metal severely damage brake rotors and double braking distance.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 15, 28, 'Measure Remaining Brake Pad Friction Lining', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (29, 16, 2, 'ABS & Braking System', 'Inspect for Glazing, Cracking, or Uneven Taper Wear', 'Check if outer pad is thick but inner pad is completely worn out (indicates sticking caliper slide pins).', 'Worn out pads grinding metal-on-metal severely damage brake rotors and double braking distance.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 16, 29, 'Inspect for Glazing, Cracking, or Uneven Taper Wear', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (30, 17, 1, 'ABS & Braking System', 'Measure Rotor Thickness Against Minimum Discard Spec', 'Use a digital vernier caliper or micrometer at multiple points around the brake disc contact band.', 'Severely thinned or heat-cracked rotors can shatter under panic braking.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 17, 30, 'Measure Rotor Thickness Against Minimum Discard Spec', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (31, 17, 2, 'ABS & Braking System', 'Inspect Rotor Face for Deep Grooves, Rust Lip, or Warping', 'Examine both inner and outer friction faces for bluing (overheating), deep circular grooves, or lateral runout vibration.', 'Severely thinned or heat-cracked rotors can shatter under panic braking.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 18, 31, 'Inspect Rotor Face for Deep Grooves, Rust Lip, or Warping', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (32, 18, 1, 'ABS & Braking System', 'Inspect Brake Shoe Friction Material Thickness', 'Measure curved friction lining thickness on leading and trailing shoes inside the rear drum assembly.', 'Contaminated brake shoes saturated with brake fluid or axle grease must never be reused.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 19, 32, 'Inspect Brake Shoe Friction Material Thickness', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (33, 18, 2, 'ABS & Braking System', 'Check Cast Iron Drum Surface for Scoring, Cracks or Out-of-Round', 'Inspect the inside braking surface of the drum for deep ridges, heat bluing, or oval out-of-round shape.', 'Contaminated brake shoes saturated with brake fluid or axle grease must never be reused.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 20, 33, 'Check Cast Iron Drum Surface for Scoring, Cracks or Out-of-Round', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (34, 19, 1, 'Air Conditioning & Climate', 'Observe Compressor Clutch Hub Engagement', 'Start engine, turn AC to MAX COLD. Watch the center hub plate of the AC compressor pulley.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 21, 34, 'Observe Compressor Clutch Hub Engagement', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (35, 19, 2, 'Air Conditioning & Climate', 'Inspect Compressor Body for Green UV Dye or Black Sludge', 'Look around the front shaft seal and case halves for oily green residue or metal shavings.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 22, 35, 'Inspect Compressor Body for Green UV Dye or Black Sludge', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (36, 20, 1, 'Air Conditioning & Climate', 'Inspect Condenser Fins for Road Debris, Bugs, and Mud', 'Look through front bumper radiator grille with a flashlight at the thin aluminum heat exchanger.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 23, 36, 'Inspect Condenser Fins for Road Debris, Bugs, and Mud', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (37, 20, 2, 'Air Conditioning & Climate', 'Check Condenser for Stone Punctures and Oily Spots', 'Inspect lower corners and face for dark damp oil spots where road gravel hit the thin tubes.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 24, 37, 'Check Condenser for Stone Punctures and Oily Spots', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (38, 21, 1, 'Air Conditioning & Climate', 'Check for Bacterial / Fungal Buildup on Evaporator Core', 'Smell air discharge on startup and inspect evaporator housing through cabin filter slot for mold.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 25, 38, 'Check for Bacterial / Fungal Buildup on Evaporator Core', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (39, 21, 2, 'Air Conditioning & Climate', 'Check Evaporator Anti-Frosting Temperature Sensor', 'Test the thermistor mounted in the evaporator fins to ensure it prevents the core from freezing into a block of ice.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 26, 39, 'Check Evaporator Anti-Frosting Temperature Sensor', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (40, 22, 1, 'Air Conditioning & Climate', 'Measure Static & Operating Refrigerant Pressures', 'Connect low-side quick coupler to port (marked L). Normal resting static pressure is 50-80 PSI depending on ambient temperature.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 27, 40, 'Measure Static & Operating Refrigerant Pressures', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (41, 22, 2, 'Air Conditioning & Climate', 'Check Service Valves and Line Joints for Seepage', 'Spray soapy water on service port schrader cores and examine all aluminum flange joints.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 28, 41, 'Check Service Valves and Line Joints for Seepage', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (42, 23, 1, 'Air Conditioning & Climate', 'Inspect Cabin Microfilter Element', 'Withdraw cabin filter from HVAC box behind glove box or beneath windshield cowl.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 29, 42, 'Inspect Cabin Microfilter Element', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (43, 23, 2, 'Air Conditioning & Climate', 'Check Windshield Cowl Mesh for Leaf Accumulation', 'Inspect plastic cowl beneath wiper arms for dead pine needles, leaves and clogged rainwater drain flaps.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 30, 43, 'Check Windshield Cowl Mesh for Leaf Accumulation', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (44, 24, 1, 'Air Conditioning & Climate', 'Test Blower Motor Electrical Response on Speed 4', 'Turn fan switch to highest speed. Measure voltage at the 2-pin blower motor harness connector.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 31, 44, 'Test Blower Motor Electrical Response on Speed 4', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (45, 24, 2, 'Air Conditioning & Climate', 'Check Squirrel Cage Fan Wheel for Foreign Objects', 'Drop motor out with 3 screws and inspect squirrel cage fan for trapped leaves, rodent nest, or broken blades.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 32, 45, 'Check Squirrel Cage Fan Wheel for Foreign Objects', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (46, 25, 1, 'Air Conditioning & Climate', 'Check Resistor Continuity with Multimeter', 'Check resistance values across stepped pins on the resistor pack or electronic PWM final stage module.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 33, 46, 'Check Resistor Continuity with Multimeter', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (47, 25, 2, 'Air Conditioning & Climate', 'Inspect Wiring Connector for Melted Plastic or Heat Discoloration', 'Examine harness plug going into resistor module for melted terminals due to excessive current draw.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 34, 47, 'Inspect Wiring Connector for Melted Plastic or Heat Discoloration', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (48, 26, 1, 'Engine Cooling System', 'Check Expansion Tank Fluid Level & Color Cold', 'With engine completely cold, observe fluid meniscus relative to MIN and MAX marks. Fluid should be bright pink, yellow, or blue.', 'NEVER open the coolant reservoir cap while engine is hot! Scalding steam and boiling liquid will erupt under pressure.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 35, 48, 'Check Expansion Tank Fluid Level & Color Cold', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (49, 26, 2, 'Engine Cooling System', 'Inspect Plastic Tank Seams and Pressurized Cap', 'Examine the molded ultrasonic weld seam around the middle of the plastic bottle and the hose nipples for hairline cracks.', 'NEVER open the coolant reservoir cap while engine is hot! Scalding steam and boiling liquid will erupt under pressure.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 36, 49, 'Inspect Plastic Tank Seams and Pressurized Cap', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (50, 27, 1, 'Engine Cooling System', 'Pressurize Cold Cooling System with Hand Tester', 'Attach radiator pressure tester adapter to expansion tank, pump to 15 PSI / 1.0 bar, and watch the gauge needle for 10 minutes.', 'Operating an engine without coolant will warp the aluminum cylinder head within minutes.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 37, 50, 'Pressurize Cold Cooling System with Hand Tester', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (51, 27, 2, 'Engine Cooling System', 'Locate Active Coolant Seepage Point', 'Trace hoses, thermostat housing plastic flange, water pump weep hole, and radiator side tanks for drips.', 'Operating an engine without coolant will warp the aluminum cylinder head within minutes.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 38, 51, 'Locate Active Coolant Seepage Point', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (52, 28, 1, 'Engine Cooling System', 'Inspect Radiator Core and Airflow Blockages', 'Ensure radiator aluminum core is not packed with mud, leaves, or plastic bags.', 'A thermostat stuck closed prevents coolant from circulating to the radiator, causing rapid overheating.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 39, 52, 'Inspect Radiator Core and Airflow Blockages', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (53, 28, 2, 'Engine Cooling System', 'Test Thermostat Opening by Touching Radiator Hoses', 'Start cold engine. Upper hose should stay cold until engine reaches 88??C - 92??C, then suddenly become hot.', 'A thermostat stuck closed prevents coolant from circulating to the radiator, causing rapid overheating.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 40, 53, 'Test Thermostat Opening by Touching Radiator Hoses', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (54, 29, 1, 'Engine Cooling System', 'Check Passenger Carpet and HVAC Housing for Coolant Stains', 'Feel underneath passenger footwell carpet near center console for damp green/pink sticky residue.', 'A leaking heater core sprays hot coolant vapor into the passenger compartment, causing sudden window fogging.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 41, 54, 'Check Passenger Carpet and HVAC Housing for Coolant Stains', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (55, 29, 2, 'Engine Cooling System', 'Compare Temperatures of Both Firewall Heater Hoses', 'Engine at 90??C with heater blower ON, touch both rubber hoses entering the passenger firewall.', 'A leaking heater core sprays hot coolant vapor into the passenger compartment, causing sudden window fogging.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 42, 55, 'Compare Temperatures of Both Firewall Heater Hoses', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (56, 30, 1, 'Engine Cooling System', 'Command Fan On by Engaging AC Compressor', 'With engine idling, switch AC to ON. On modern vehicles, this automatically triggers radiator fan speed 1.', 'Electric cooling fans can start automatically at any time even with key off. Keep hands clear.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 43, 56, 'Command Fan On by Engaging AC Compressor', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (57, 30, 2, 'Engine Cooling System', 'Inspect Fan Relay and Motor Resistor Pack', 'Locate cooling fan relay in underhood fuse box. Swap with identical horn/defrost relay to test.', 'Electric cooling fans can start automatically at any time even with key off. Keep hands clear.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 44, 57, 'Inspect Fan Relay and Motor Resistor Pack', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (58, 31, 1, 'Engine Cooling System', 'Squeeze Hoses to Inspect Rubber Condition', 'Check along full length of upper and lower radiator hoses for bulging, softening from oil contamination, or dry rotting.', 'A ruptured upper radiator hose instantly dumps entire cooling volume directly over the hot engine.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 45, 58, 'Squeeze Hoses to Inspect Rubber Condition', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (59, 31, 2, 'Engine Cooling System', 'Check Metal / Plastic Radiator Spigot Joints for Crusty Residue', 'Examine ends where hoses clamp onto radiator and thermostat housing for dried white/pink crystalline coolant deposits.', 'A ruptured upper radiator hose instantly dumps entire cooling volume directly over the hot engine.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 46, 59, 'Check Metal / Plastic Radiator Spigot Joints for Crusty Residue', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (60, 32, 1, 'Engine Cooling System', 'Inspect Water Pump Weep Hole for Coolant Stains', 'Use a dental inspection mirror or flashlight to look beneath the water pump pulley hub at the small weep drain hole.', 'If water pump is driven by timing belt, bearing seizure can snap the belt and destroy engine valves.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 47, 60, 'Inspect Water Pump Weep Hole for Coolant Stains', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (61, 32, 2, 'Engine Cooling System', 'Check Impeller Circulation & Pulley Play with Belt Removed', 'Wiggle water pump pulley with belt off to detect shaft play, and observe return flow into expansion tank at 2500 RPM.', 'If water pump is driven by timing belt, bearing seizure can snap the belt and destroy engine valves.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 48, 61, 'Check Impeller Circulation & Pulley Play with Belt Removed', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (62, 33, 1, 'Fuel & Injection System', 'Check Injector Spray Pattern & Balance Rates', 'Perform injector balance test or remove fuel rail with injectors attached and crank into graduated test beakers.', 'A leaking injector stuck open can wash cylinder oil away or cause hydraulic engine lock (hydrolock).', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 49, 62, 'Check Injector Spray Pattern & Balance Rates', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (63, 33, 2, 'Fuel & Injection System', 'Test Injector Solenoid Resistance with Multimeter', 'Unplug electrical harness and measure coil resistance across the 2 pins (spec: 12-16 ohms high-Z, 2-4 ohms low-Z).', 'A leaking injector stuck open can wash cylinder oil away or cause hydraulic engine lock (hydrolock).', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 50, 63, 'Test Injector Solenoid Resistance with Multimeter', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (64, 34, 1, 'Fuel & Injection System', 'Inspect Vacuum Port for Raw Gasoline Presence', 'Engine off, pull small rubber vacuum hose off the regulator snout and inspect for liquid fuel or smell.', 'A ruptured regulator diaphragm dumps raw fuel directly into the engine intake manifold through vacuum port.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 51, 64, 'Inspect Vacuum Port for Raw Gasoline Presence', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (65, 34, 2, 'Fuel & Injection System', 'Measure Fuel Rail Pressure at Schrader Valve', 'Screw fuel pressure test gauge onto fuel rail test port. Key ON engine OFF, verify pressure against manufacturer spec (e.g. 3.5 bar).', 'A ruptured regulator diaphragm dumps raw fuel directly into the engine intake manifold through vacuum port.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 52, 65, 'Measure Fuel Rail Pressure at Schrader Valve', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (66, 35, 1, 'Fuel & Injection System', 'Check Fuel Delivery Pressure & Volume', 'Connect fuel gauge to fuel rail. Read static prime pressure and flow volume into measuring bottle (min 1L per minute).', 'Never test fuel pump wiring near open fuel containers or spilled gasoline. Disconnect battery.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 53, 66, 'Check Fuel Delivery Pressure & Volume', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (67, 35, 2, 'Fuel & Injection System', 'Inspect Fuel Pump Flange & Electrical Harness Under Rear Seat', 'Remove rear seat cushion, pop open metal access hatch, and inspect electrical plug for melted pins.', 'Never test fuel pump wiring near open fuel containers or spilled gasoline. Disconnect battery.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 54, 67, 'Inspect Fuel Pump Flange & Electrical Harness Under Rear Seat', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (68, 36, 1, 'Fuel & Injection System', 'Inspect Tank Shell, Seams, and Filler Neck', 'Lift vehicle and visually inspect tank straps, metal filler neck pipe behind rear wheel liner, and tank bottom for rust or scrape gouges.', 'Liquid fuel leaks or heavy vapor accumulation under vehicle create extreme fire hazard.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 55, 68, 'Inspect Tank Shell, Seams, and Filler Neck', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (69, 36, 2, 'Fuel & Injection System', 'Check Gas Cap Rubber O-Ring Gasket', 'Unscrew gas cap and inspect rubber sealing ring for cracking, deformation, or loose ratchet clicking mechanism.', 'Liquid fuel leaks or heavy vapor accumulation under vehicle create extreme fire hazard.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 56, 69, 'Check Gas Cap Rubber O-Ring Gasket', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (70, 37, 1, 'Fuel & Injection System', 'Check Fuel Filter Service Mileage and Flow Restriction', 'Locate inline fuel filter under vehicle floor pan or in engine compartment (diesel). Check service records.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 57, 70, 'Check Fuel Filter Service Mileage and Flow Restriction', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (71, 37, 2, 'Fuel & Injection System', 'Verify Quick-Disconnect Fittings and Direction Arrow', 'Ensure filter is installed with directional arrow pointing toward engine, and disconnects are clicked firmly.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 58, 71, 'Verify Quick-Disconnect Fittings and Direction Arrow', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (72, 38, 1, 'Engine Mechanical & Valvetrain', 'Inspect Timing Belt Teeth and Backing for Cracking or Oil Soaking', 'Remove top timing cover clips. Examine rubber teeth, looking for missing teeth, shredded cords, or oil contamination.', 'On interference engines, a broken timing belt causes pistons to smash into open valves, destroying the engine.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 59, 72, 'Inspect Timing Belt Teeth and Backing for Cracking or Oil Soaking', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (73, 38, 2, 'Engine Mechanical & Valvetrain', 'Verify Crankshaft and Camshaft TDC Timing Alignment Marks', 'Rotate engine by hand to Top Dead Center (TDC) on cylinder 1. Check if camshaft and crankshaft index marks align precisely.', 'On interference engines, a broken timing belt causes pistons to smash into open valves, destroying the engine.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 60, 73, 'Verify Crankshaft and Camshaft TDC Timing Alignment Marks', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (74, 39, 1, 'Engine Mechanical & Valvetrain', 'Inspect V-Ribbed Belt Surface for Cracks & Glazing', 'Examine underside multi-V ribs with flashlight. Count cracks: more than 3 cracks per inch indicates imminent failure.', 'A snapped serpentine belt immediately cuts alternator charging, water pump circulation, and power steering assist.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 61, 74, 'Inspect V-Ribbed Belt Surface for Cracks & Glazing', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (75, 39, 2, 'Engine Mechanical & Valvetrain', 'Check Automatic Belt Tensioner & Pulley Coplanarity', 'Observe automatic tensioner arm while engine idles. It should remain steady without aggressive bouncing or chatter.', 'A snapped serpentine belt immediately cuts alternator charging, water pump circulation, and power steering assist.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 62, 75, 'Check Automatic Belt Tensioner & Pulley Coplanarity', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (76, 40, 1, 'Engine Mechanical & Valvetrain', 'Compare Specified vs Actual Manifold Boost Pressure', 'Read live OBD data for MAP (Manifold Absolute Pressure) during wide open throttle acceleration in 3rd gear.', 'A catastrophic turbo compressor wheel breakup can send aluminum fragments into engine cylinders.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 63, 76, 'Compare Specified vs Actual Manifold Boost Pressure', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (77, 40, 2, 'Engine Mechanical & Valvetrain', 'Inspect Intercooler End Tanks and Silicone Boost Hoses', 'Examine lower front intercooler for split plastic end caps or oily residue indicating boost pressure leaks.', 'A catastrophic turbo compressor wheel breakup can send aluminum fragments into engine cylinders.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 64, 77, 'Inspect Intercooler End Tanks and Silicone Boost Hoses', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (78, 41, 1, 'Engine Mechanical & Valvetrain', 'Measure Individual Glow Plug Internal Resistance', 'Disconnect wiring harness bus bar, attach multimeter negative to engine block and positive to glow plug terminal.', 'Glow plugs can seize in aluminum cylinder heads. Always soak with penetrating oil and use a torque wrench to avoid snapping.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 65, 78, 'Measure Individual Glow Plug Internal Resistance', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (79, 41, 2, 'Engine Mechanical & Valvetrain', 'Inspect Glow Plug Tips for Carbon Blistering or Melting', 'Examine removed glow plug tips for excessive black crust, swollen tips, or erosion from faulty fuel injector spray.', 'Glow plugs can seize in aluminum cylinder heads. Always soak with penetrating oil and use a torque wrench to avoid snapping.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 66, 79, 'Inspect Glow Plug Tips for Carbon Blistering or Melting', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (80, 42, 1, 'Engine Mechanical & Valvetrain', 'Inspect Rubber Bushings and Hydraulic Fluid Chambers', 'Examine right passenger side hydraulic mount and lower rear dogbone torque mount for torn rubber and black fluid stains.', 'A completely broken engine mount allows engine to shift, stressing radiator hoses, wiring, and exhaust flex pipes.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 67, 80, 'Inspect Rubber Bushings and Hydraulic Fluid Chambers', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (81, 42, 2, 'Engine Mechanical & Valvetrain', 'Check Engine Mount Retaining Bolts & Bracket Torque', 'Verify with a torque wrench that all subframe and engine bracket mounting bolts are tight.', 'A completely broken engine mount allows engine to shift, stressing radiator hoses, wiring, and exhaust flex pipes.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 68, 81, 'Check Engine Mount Retaining Bolts & Bracket Torque', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (82, 43, 1, 'Engine Mechanical & Valvetrain', 'Inspect Valve Cover Perimeter & Spark Plug Wells for Oil', 'Pull ignition coils out of spark plug tubes. If rubber coil boots come out dripping in engine oil, internal tube seals have failed.', 'Oil dripping onto hot exhaust manifold creates white smoke and fire risk in engine compartment.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 69, 82, 'Inspect Valve Cover Perimeter & Spark Plug Wells for Oil', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (83, 43, 2, 'Engine Mechanical & Valvetrain', 'Check Valve Cover Bolt Torque', 'Verify small 10mm bolts are torqued evenly (typically 8 to 10 Nm).', 'Oil dripping onto hot exhaust manifold creates white smoke and fire risk in engine compartment.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 70, 83, 'Check Valve Cover Bolt Torque', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (84, 44, 1, 'Engine Mechanical & Valvetrain', 'Measure True Engine Oil Pressure with Mechanical Gauge', 'Remove oil pressure sensor switch, install mechanical gauge. Test hot: minimum 1.0 bar (15 PSI) at idle, 3.5 bar (50 PSI) at 3000 RPM.', 'STOP ENGINE IMMEDIATELY if red oil pressure light flashes. Operating without oil pressure ruins crankshaft bearings in seconds.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 71, 84, 'Measure True Engine Oil Pressure with Mechanical Gauge', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (85, 44, 2, 'Engine Mechanical & Valvetrain', 'Check Oil Pump Pressure Relief Valve & Drive Chain', 'Inspect pressure relief bypass plunger to verify it is not stuck open by metal debris.', 'STOP ENGINE IMMEDIATELY if red oil pressure light flashes. Operating without oil pressure ruins crankshaft bearings in seconds.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 72, 85, 'Check Oil Pump Pressure Relief Valve & Drive Chain', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (86, 45, 1, 'Engine Mechanical & Valvetrain', 'Dry & Wet Cylinder Compression Test', 'Remove all spark plugs, disable fuel pump, screw compression gauge into cylinder 1. Crank engine through 5 compression pulses.', 'Worn oil control rings cause oil burning, destroying the catalytic converter and spark plugs.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 73, 86, 'Dry & Wet Cylinder Compression Test', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (87, 45, 2, 'Engine Mechanical & Valvetrain', 'Check for Excessive Crankcase Blow-By Pressure', 'Engine idling warm, loosen oil filler cap and let it rest on valve cover neck. Check if cap jumps off violently from blow-by pressure.', 'Worn oil control rings cause oil burning, destroying the catalytic converter and spark plugs.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 74, 87, 'Check for Excessive Crankcase Blow-By Pressure', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (88, 46, 1, 'Emissions & Exhaust System', 'Tap Converter Body and Check for Broken Ceramic Substrate', 'Hit converter casing with a rubber mallet. Listen for internal loose ceramic honeycomb rattling like stones in a tin can.', 'A clogged catalytic converter creates extreme exhaust backpressure, causing severe engine overheating and loss of power.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 75, 88, 'Tap Converter Body and Check for Broken Ceramic Substrate', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (89, 46, 2, 'Emissions & Exhaust System', 'Compare Upstream and Downstream O2 Sensor Switching', 'Read live OBD data: upstream O2 sensor should oscillate rapidly between 0.1V and 0.9V, while downstream sensor should stay nearly flat (~0.45V - 0.7V).', 'A clogged catalytic converter creates extreme exhaust backpressure, causing severe engine overheating and loss of power.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 76, 89, 'Compare Upstream and Downstream O2 Sensor Switching', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (90, 47, 1, 'Emissions & Exhaust System', 'Check Upstream O2 Sensor Switching Frequency', 'Observe sensor voltage on OBD live scanner. At hot idle, voltage must cycle cleanly between 0.1V (lean) and 0.9V (rich) every 1 to 2 seconds.', 'A failed upstream oxygen sensor forces the ECU into open-loop limp mode, running rich and clogging the catalytic converter.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 77, 90, 'Check Upstream O2 Sensor Switching Frequency', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (91, 47, 2, 'Emissions & Exhaust System', 'Check Wiring Harness for Melted Insulation & Heater Resistance', 'Inspect 4-wire sensor harness where it runs near the hot exhaust manifold. Measure resistance across the two identical heater wires (spec: 4-15 ohms).', 'A failed upstream oxygen sensor forces the ECU into open-loop limp mode, running rich and clogging the catalytic converter.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 78, 91, 'Check Wiring Harness for Melted Insulation & Heater Resistance', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (92, 48, 1, 'Emissions & Exhaust System', 'Check Purge Valve Sealing (Normally Closed)', 'Remove valve from intake manifold. Blow into inlet nipple by mouth or vacuum pump with power disconnected.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 79, 92, 'Check Purge Valve Sealing (Normally Closed)', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (93, 48, 2, 'Emissions & Exhaust System', 'Inspect Plastic & Rubber Vapor Lines from Fuel Tank to Engine', 'Inspect the thin nylon vapor line routing from the rear fuel tank charcoal canister up to the intake plenum.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 80, 93, 'Inspect Plastic & Rubber Vapor Lines from Fuel Tank to Engine', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (94, 49, 1, 'Emissions & Exhaust System', 'Visual Inspection for Hairline Cracks & Carbon Soot Trails', 'Examine cast iron or tubular stainless steel exhaust manifold between cylinder runners for hairline heat cracks.', 'Exhaust gases contain odorless carbon monoxide (CO) which can enter the cabin through the ventilation system.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 81, 94, 'Visual Inspection for Hairline Cracks & Carbon Soot Trails', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (95, 49, 2, 'Emissions & Exhaust System', 'Check for Broken or Snapped Manifold Stud Bolts', 'Examine each cylinder head stud. Often the rearmost or frontmost stud snaps off flush with the cylinder head.', 'Exhaust gases contain odorless carbon monoxide (CO) which can enter the cabin through the ventilation system.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 82, 95, 'Check for Broken or Snapped Manifold Stud Bolts', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (96, 50, 1, 'Emissions & Exhaust System', 'Check MAP Sensor Reference & Output Voltage', 'Measure 5V reference wire, ground wire, and signal wire with multimeter or OBD scanner. Output should drop from ~4.5V down to ~1.2V at idle vacuum.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 83, 96, 'Check MAP Sensor Reference & Output Voltage', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (97, 50, 2, 'Emissions & Exhaust System', 'Check Vacuum Hose or Mounting O-Ring for Air Leaks', 'Inspect small rubber vacuum hose or green rubber seal ring where sensor mounts into plastic intake manifold.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 84, 97, 'Check Vacuum Hose or Mounting O-Ring for Air Leaks', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (98, 51, 1, 'Electrical & Starting System', 'Measure Resting & Cranking Battery Voltage', 'Engine off, touch multimeter leads to battery posts: 12.6V is fully charged. Have a helper crank engine: voltage must not drop below 9.6V.', 'Car batteries produce explosive hydrogen gas during charging. Keep sparks and open flames away.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 85, 98, 'Measure Resting & Cranking Battery Voltage', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (99, 51, 2, 'Electrical & Starting System', 'Inspect Lead Posts for White/Blue Powdery Corrosion & Tightness', 'Grab battery cable clamps and try to twist them by hand. They should be rock solid and free of corrosion.', 'Car batteries produce explosive hydrogen gas during charging. Keep sparks and open flames away.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 86, 99, 'Inspect Lead Posts for White/Blue Powdery Corrosion & Tightness', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (100, 52, 1, 'Electrical & Starting System', 'Measure Regulated Alternator Charging Voltage Under Load', 'Start engine, turn on high beams and rear defroster. Measure voltage across battery terminals with digital multimeter.', 'If alternator fails while driving, the vehicle will stall as soon as the battery drains, losing power steering and brake assist.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 87, 100, 'Measure Regulated Alternator Charging Voltage Under Load', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (101, 52, 2, 'Electrical & Starting System', 'Check Serpentine Belt Slippage on Alternator Pulley', 'Inspect belt tensioner and check if alternator pulley spins freely without squealing under high electrical load.', 'If alternator fails while driving, the vehicle will stall as soon as the battery drains, losing power steering and brake assist.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 88, 101, 'Check Serpentine Belt Slippage on Alternator Pulley', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (102, 53, 1, 'Electrical & Starting System', 'Check 12V Trigger Signal at Solenoid Terminal 50', 'Attach test light or multimeter probe to small trigger wire on starter. Turn ignition key to START position.', 'Ensure vehicle is in Neutral (or Park) with handbrake set before testing starter motor terminals.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 89, 102, 'Check 12V Trigger Signal at Solenoid Terminal 50', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (103, 53, 2, 'Electrical & Starting System', 'Inspect Starter Internal Carbon Brushes & Bendix Drive', 'Check if starter motor whines without spinning the engine (bendix one-way clutch slipping) or draws zero current (worn brushes).', 'Ensure vehicle is in Neutral (or Park) with handbrake set before testing starter motor terminals.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 90, 103, 'Inspect Starter Internal Carbon Brushes & Bendix Drive', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (104, 54, 1, 'Electrical & Starting System', 'Inspect Distributor Cap / Coil-on-Plug Boots for Carbon Tracking', 'Examine inside of distributor cap or rubber spark plug coil boots for faint grey carbon lightning tracks or hairline cracks.', 'Secondary ignition voltage reaches 25,000 to 45,000 volts. Do not touch bare wires while engine runs.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 91, 104, 'Inspect Distributor Cap / Coil-on-Plug Boots for Carbon Tracking', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (105, 54, 2, 'Electrical & Starting System', 'Measure Ignition Wire Resistance with Multimeter', 'Measure resistance end-to-end on each spark plug wire (standard rule: approx 3,000 to 7,000 ohms per foot).', 'Secondary ignition voltage reaches 25,000 to 45,000 volts. Do not touch bare wires while engine runs.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 92, 105, 'Measure Ignition Wire Resistance with Multimeter', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (106, 55, 1, 'Electrical & Starting System', 'Test 12V Power & Ground Reversal at Motor Plug', 'Remove door panel trim, unplug 2-pin motor connector, attach test light, and press window switch UP and DOWN.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 93, 106, 'Test 12V Power & Ground Reversal at Motor Plug', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (107, 55, 2, 'Electrical & Starting System', 'Inspect Regulator Cable Spool and Plastic Glass Clips', 'Examine steel cables inside door. Check if cable is tangled in drive spool or plastic guide slider clip is broken.', '', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 94, 107, 'Inspect Regulator Cable Spool and Plastic Glass Clips', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (108, 56, 1, 'Electrical & Starting System', 'Remove Bulb and Check Tungsten Filament Under Light', 'Remove rubber dust cap, unclip spring wire, pull out H7/H4 bulb. Look for broken wire filament or dark silver deposit inside bulb glass.', 'Do NOT touch new halogen or xenon bulb glass with bare fingers; skin oils create hot spots and shatter the glass.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 95, 108, 'Remove Bulb and Check Tungsten Filament Under Light', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (109, 56, 2, 'Electrical & Starting System', 'Inspect Plastic Plug and Female Spade Terminals', 'Look inside plastic socket for melted brown plastic, green corrosion, or loose loose spade grips.', 'Do NOT touch new halogen or xenon bulb glass with bare fingers; skin oils create hot spots and shatter the glass.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 96, 109, 'Inspect Plastic Plug and Female Spade Terminals', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (110, 57, 1, 'Electrical & Starting System', 'Check Voltage at Wiper Motor Connector', 'Switch wipers to LOW and HIGH. Probe wiper motor harness pins with test light or multimeter.', 'Driving in heavy rain with failed wipers creates immediate zero-visibility hazard.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 97, 110, 'Check Voltage at Wiper Motor Connector', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (111, 57, 2, 'Electrical & Starting System', 'Inspect Transmission Linkage Ball Joints & Pivot Bushings', 'Remove plastic cowl cover and inspect metal wiper transmission arms. Check if plastic ball socket joint has popped apart.', 'Driving in heavy rain with failed wipers creates immediate zero-visibility hazard.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 98, 111, 'Inspect Transmission Linkage Ball Joints & Pivot Bushings', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (112, 58, 1, 'Transmission & Drivetrain', 'Inspect Clutch Master Cylinder Pushrod Above Footwell Pedal', 'Look up under driver dashboard where clutch pedal pushrod enters the firewall master cylinder boot for fluid leaks.', 'Loss of clutch hydraulic pressure leaves vehicle permanently in gear or unable to shift.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 99, 112, 'Inspect Clutch Master Cylinder Pushrod Above Footwell Pedal', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (113, 58, 2, 'Transmission & Drivetrain', 'Inspect Clutch Slave Cylinder on Transmission Bellhousing', 'Inspect external slave cylinder rubber dust boot on gearbox (or concentric slave cylinder bellhousing weep hole).', 'Loss of clutch hydraulic pressure leaves vehicle permanently in gear or unable to shift.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 100, 113, 'Inspect Clutch Slave Cylinder on Transmission Bellhousing', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (114, 59, 1, 'Transmission & Drivetrain', 'Check Automatic Transmission Fluid (ATF) Level & Color', 'Engine idling warm in Park, pull ATF dipstick (or check level plug at 35??C-45??C). Wipe on white paper towel: check if dark brown/black with burnt smell.', 'Driving with low ATF level burns internal clutch friction plates and overheats the torque converter.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 101, 114, 'Check Automatic Transmission Fluid (ATF) Level & Color', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (115, 59, 2, 'Transmission & Drivetrain', 'Inspect Transmission Pan Gasket & Magnet Sediment', 'Inspect pan perimeter for wet fluid leaks. Drop pan to inspect internal filter and magnet for metallic silver flake buildup.', 'Driving with low ATF level burns internal clutch friction plates and overheats the torque converter.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 102, 115, 'Inspect Transmission Pan Gasket & Magnet Sediment', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (116, 60, 1, 'Transmission & Drivetrain', 'Check U-Joint Cross Bearing Play & CV Rubber Boot Integrity', 'Inspect cross trunnions for rusty needle bearing dust and twist driveshaft in opposite directions across joint.', 'A severed driveshaft universal joint at highway speed can drop and vault the vehicle.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 103, 116, 'Check U-Joint Cross Bearing Play & CV Rubber Boot Integrity', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (117, 60, 2, 'Transmission & Drivetrain', 'Inspect Center Support Carrier Bearing Rubber & Shaft Balance', 'Examine center rubber doughnut carrier bearing for tears and check for missing welded balance weights on steel tube.', 'A severed driveshaft universal joint at highway speed can drop and vault the vehicle.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 104, 117, 'Inspect Center Support Carrier Bearing Rubber & Shaft Balance', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (118, 61, 1, 'Transmission & Drivetrain', 'Check Gear Oil Level & Inspect for Metallic Shimmer', 'Remove fill plug on differential housing. Fluid level should be level with bottom of fill hole. Check for burnt smell or glitter.', 'A differential running dry of gear oil will seize the drive wheels at speed.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 105, 118, 'Check Gear Oil Level & Inspect for Metallic Shimmer', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (119, 61, 2, 'Transmission & Drivetrain', 'Check Pinion Bearing Play and Gear Mesh Backlash', 'Wiggle differential pinion input flange up and down by hand to test tapered roller bearing play.', 'A differential running dry of gear oil will seize the drive wheels at speed.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 106, 119, 'Check Pinion Bearing Play and Gear Mesh Backlash', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (120, 62, 1, 'Steering System', 'Check Fluid Level on Reservoir Dipstick', 'Engine idling, turn steering wheel lock-to-lock twice. Check reservoir level against COLD / HOT marks. Check if fluid is brown or aerated.', 'Sudden loss of power steering assist while parking or cornering dramatically increases steering effort.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 107, 120, 'Check Fluid Level on Reservoir Dipstick', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (121, 62, 2, 'Steering System', 'Inspect High-Pressure Steering Hoses and Steering Rack Boots', 'Examine high-pressure crimped steering hose connections and rubber steering rack tie-rod boots for wet oil seepage.', 'Sudden loss of power steering assist while parking or cornering dramatically increases steering effort.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 108, 121, 'Inspect High-Pressure Steering Hoses and Steering Rack Boots', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (122, 63, 1, 'Wheels & Tires', 'Rock Tire at 12 and 6 O''clock Positions', 'Raise corner on jack stand. Place one hand at 12 o''clock and other at 6 o''clock on tire tread; push and pull firmly.', 'A completely failed wheel bearing can seize solid or allow the wheel and hub to detach from vehicle at highway speeds.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 109, 122, 'Rock Tire at 12 and 6 O''clock Positions', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (123, 63, 2, 'Wheels & Tires', 'Spin Wheel by Hand and Feel Suspension Spring for Vibration', 'Spin raised tire rapidly by hand while holding coil spring with fingers. If spring vibrates like a coarse guitar string, bearing is pitted.', 'A completely failed wheel bearing can seize solid or allow the wheel and hub to detach from vehicle at highway speeds.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 110, 123, 'Spin Wheel by Hand and Feel Suspension Spring for Vibration', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (124, 64, 1, 'Wheels & Tires', 'Measure Cold Pressure on All 4 Tires with Calibrated Gauge', 'Read pressure on each tire when cold. Compare against recommended PSI values listed on driver B-pillar door placard.', 'Underinflated tires generate extreme internal friction heat, causing tire tread delamination and blowouts.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 111, 124, 'Measure Cold Pressure on All 4 Tires with Calibrated Gauge', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO diagnostic_questions (id, symptom_id, step_num, category, title, description, warning_text, question_type, safety_critical, why_ask, image_url, reformulation, test_action, test_type, source_record_id)
VALUES (125, 64, 2, 'Wheels & Tires', 'Check TPMS Sensor Radio Transmission & Battery Life', 'Scan sensor with TPMS diagnostic tool to read internal battery state (batteries typically last 7 to 10 years).', 'Underinflated tires generate extreme internal friction heat, causing tire tread delamination and blowouts.', 'action_test', 0, NULL, NULL, NULL, NULL, 'observation', NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('question', 112, 125, 'Check TPMS Sensor Radio Transmission & Battery Life', 'Migrated question from questions table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);

-- 3. Insertion des 220 options de réponses dans answer_options
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (41, 16, 'Blown fuse', 'A blown fuse cuts power to the ABS solenoid block and computer module.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 9, 41, 'Blown fuse', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (42, 16, 'Intact fuse', 'Fuse has electrical continuity. Power delivery upstream is likely functional.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 10, 42, 'Intact fuse', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (43, 17, 'Faulty wiring / corroded pins', 'Damaged wiring prevents communication between the wheel sensors, ECU, and ABS pump.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 11, 43, 'Faulty wiring / corroded pins', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (44, 17, 'Good wiring & secure connector', 'Wiring and physical connectivity are sound. Internal electronic or solenoid failure suspected.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 12, 44, 'Good wiring & secure connector', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (45, 18, 'Loose / damaged connections', 'A severed or intermittent wire interrupts the wheel rotation frequency signal.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 13, 45, 'Loose / damaged connections', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (46, 18, 'Secure & intact connections', 'Electrical harness continuity looks normal up to the knuckle.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 14, 46, 'Secure & intact connections', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (47, 19, 'Dirty / metallic debris / cracked ring', 'Metallic brake dust or a cracked tone ring distorts the pulse signal sent to the ABS computer.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 15, 47, 'Dirty / metallic debris / cracked ring', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (48, 19, 'Clean and intact', 'Physical condition is clean. Internal coil resistance may have failed.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 16, 48, 'Clean and intact', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (49, 20, 'Leaking / split / disconnected hose', 'Vacuum loss prevents the booster diaphragm from multiplying pedal effort, making the pedal rock hard.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 17, 49, 'Leaking / split / disconnected hose', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (50, 20, 'Intact hose with firm vacuum', 'Vacuum supply is present. Internal diaphragm leak or master cylinder seal issue suspected.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 18, 50, 'Intact hose with firm vacuum', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (51, 21, 'Pedal stays hard, does not drop slightly', 'Internal booster diaphragm ruptured or vacuum pump failure.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 19, 51, 'Pedal stays hard, does not drop slightly', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (52, 21, 'Pedal drops smoothly about 1-2 cm', 'Booster vacuum assist is functioning properly.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 20, 52, 'Pedal drops smoothly about 1-2 cm', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (53, 22, 'Leaking brake fluid', 'Piston seal failure leaks hydraulic fluid, causing sudden pedal sponginess and total brake failure.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 21, 53, 'Leaking brake fluid', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (54, 22, 'No fluid leaks detected', 'Hydraulic sealing is intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 22, 54, 'No fluid leaks detected', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (55, 23, 'Stuck piston / wheel locked or hard to rotate', 'Corroded caliper piston or seized slide pins keep the brake pad clamped against the rotor.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 23, 55, 'Stuck piston / wheel locked or hard to rotate', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (56, 23, 'Free-moving piston / wheel rotates freely after release', 'Caliper mechanical release is operating normally.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 24, 56, 'Free-moving piston / wheel rotates freely after release', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (57, 24, 'Cracked, bulging or leaking hose', 'Aging rubber degrades from UV, ozone, and pressure cycles, risking sudden blowout.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 25, 57, 'Cracked, bulging or leaking hose', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (58, 24, 'Intact hose with smooth rubber', 'Exterior rubber sheath is healthy.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 26, 58, 'Intact hose with smooth rubber', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (59, 25, 'Hose expands or balloons under pressure', 'Internal reinforcement braids have severed, absorbing pressure and softening the pedal feel.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 27, 59, 'Hose expands or balloons under pressure', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (60, 25, 'Passes pressure test, no swelling', 'Hose withstands full hydraulic working pressure.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 28, 60, 'Passes pressure test, no swelling', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (61, 26, 'Low fluid level / dark black contaminated fluid', 'Low fluid indicates either worn brake friction material or an active external hydraulic leak.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 29, 61, 'Low fluid level / dark black contaminated fluid', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (62, 26, 'Normal fluid level', 'Fluid capacity is adequate.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 30, 62, 'Normal fluid level', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (63, 27, 'Leaking at rear seal or pedal slowly creeps downward', 'Internal rubber piston cups are worn, allowing fluid to bypass between primary and secondary chambers.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 31, 63, 'Leaking at rear seal or pedal slowly creeps downward', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (64, 27, 'Intact, dry and pedal holds rock steady', 'Master cylinder hydraulic integrity confirmed.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 32, 64, 'Intact, dry and pedal holds rock steady', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (65, 28, 'Worn pads (below 3mm or backing plate touching)', 'Acoustic wear indicators or metal backing plate rubbing on rotor disc, creating high pitched squeal or grinding.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 33, 65, 'Worn pads (below 3mm or backing plate touching)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (66, 28, 'Sufficient thickness (above 5mm)', 'Friction lining has substantial remaining life.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 34, 66, 'Sufficient thickness (above 5mm)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (67, 29, 'Uneven / glazed / cracked pads', 'Sticking caliper guide pins cause one pad to drag continuously, overheating and glazing the friction layer.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 35, 67, 'Uneven / glazed / cracked pads', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (68, 29, 'Good condition pads with flat uniform wear', 'Pads are functioning properly. Squeal may be due to missing anti-squeal shims or harmless brake dust.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 36, 68, 'Good condition pads with flat uniform wear', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (69, 30, 'Thin rotor below minimum thickness spec (MIN TH)', 'Rotor has lost thermal mass, overheating rapidly and risking structural fracture.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 37, 69, 'Thin rotor below minimum thickness spec (MIN TH)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (70, 30, 'Sufficient thickness rotor', 'Rotor thickness is within allowable service limits.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 38, 70, 'Sufficient thickness rotor', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (71, 31, 'Scored / warped / heat spotted rotor', 'Disc thickness variation (DTV) or lateral runout pushes the pads back, creating pulsation felt in the pedal and steering wheel.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 39, 71, 'Scored / warped / heat spotted rotor', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (72, 31, 'Smooth and flat rotor surface', 'Rotor surface finish is within tolerance.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 40, 72, 'Smooth and flat rotor surface', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (73, 32, 'Worn shoes (under 1.5mm) or contaminated with fluid', 'Brake shoes worn to rivets or soaked from a leaking wheel cylinder.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 41, 73, 'Worn shoes (under 1.5mm) or contaminated with fluid', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (74, 32, 'Good condition shoes with ample lining', 'Shoe linings have good remaining thickness.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 42, 74, 'Good condition shoes with ample lining', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (75, 33, 'Scored / cracked / oval drum', 'Warped drum causes surging braking and grabby rear wheels.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 43, 75, 'Scored / cracked / oval drum', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (76, 33, 'Smooth and uniform drum surface', 'Drum braking diameter is within tolerance.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 44, 76, 'Smooth and uniform drum surface', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (77, 34, 'Clutch not engaging (pulley spins but center hub stationary)', 'Low refrigerant pressure switch cutoff, blown AC clutch fuse, or open electromagnetic coil.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 45, 77, 'Clutch not engaging (pulley spins but center hub stationary)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (78, 34, 'Clutch engages properly (center hub spins with pulley)', 'Compressor mechanical drive is engaging.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 46, 78, 'Clutch engages properly (center hub spins with pulley)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (79, 35, 'Leaking / damaged compressor / grinding noise', 'Shaft seal failure leaks refrigerant and PAG oil. Internal piston seizure produces metallic rattling.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 47, 79, 'Leaking / damaged compressor / grinding noise', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (80, 35, 'Intact and dry compressor casing', 'Compressor exterior integrity is intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 48, 80, 'Intact and dry compressor casing', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (81, 36, 'Debris / blockage / bent fins present', 'Blocked airflow prevents hot high-pressure gas from condensing into liquid refrigerant.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 49, 81, 'Debris / blockage / bent fins present', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (82, 36, 'Clean / clear condenser with good airflow', 'Air passages are open.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 50, 82, 'Clean / clear condenser with good airflow', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (83, 37, 'Leaking condenser (green UV stain or oily patch)', 'Stone strike puncture has vented all refrigerant gas to atmosphere.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 51, 83, 'Leaking condenser (green UV stain or oily patch)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (84, 37, 'No leaks detected', 'Condenser tubes are sealed and pressurized.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 52, 84, 'No leaks detected', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (85, 38, 'Mold / mildew odor present', 'Condensation moisture trapped in dark evaporator chamber breeds mildew and fungal colonies.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 53, 85, 'Mold / mildew odor present', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (86, 38, 'Clean evaporator with fresh smelling airflow', 'Evaporator core is clean.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 54, 86, 'Clean evaporator with fresh smelling airflow', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (87, 39, 'Faulty sensor (air flows cold then stops after 15 min)', 'Faulty sensor fails to cycle compressor, causing ice buildup that blocks all airflow through the core.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 55, 87, 'Faulty sensor (air flows cold then stops after 15 min)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (88, 39, 'Good sensor cycling compressor normally', 'Core temperature reading is accurate.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 56, 88, 'Good sensor cycling compressor normally', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (89, 40, 'Low pressure (below 25 PSI operating)', 'Refrigerant gas has leaked out slowly over time through O-rings, schrader valves, or hose crimps.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 57, 89, 'Low pressure (below 25 PSI operating)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (90, 40, 'Normal pressure (30-40 PSI low side, 150-200 PSI high side)', 'Refrigerant volume is optimal.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 58, 90, 'Normal pressure (30-40 PSI low side, 150-200 PSI high side)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (91, 41, 'Leaking system (bubbles at valve or joints)', 'Rubber O-rings have dried out or schrader valve needle is loose.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 59, 91, 'Leaking system (bubbles at valve or joints)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (92, 41, 'No leaks detected at ports', 'Service connections are sealed.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 60, 92, 'No leaks detected at ports', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (93, 42, 'Dirty / clogged filter (choked with dust & debris)', 'Restricts blower motor airflow up to 70% and causes stale musty smells inside cabin.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 61, 93, 'Dirty / clogged filter (choked with dust & debris)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (94, 42, 'Clean / new white filter', 'Filter media allows full airflow.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 62, 94, 'Clean / new white filter', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (95, 43, 'Debris in air intake chamber', 'Debris holds rain moisture and rots, pulling damp odors directly into the ventilation blower.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 63, 95, 'Debris in air intake chamber', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (96, 43, 'Clear intake without obstruction', 'Fresh air path is clear.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 64, 96, 'Clear intake without obstruction', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (97, 44, 'Motor not running despite 12V power present', 'Worn carbon brushes or burned motor windings prevent armature rotation.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 65, 97, 'Motor not running despite 12V power present', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (98, 44, 'Motor running properly', 'Blower electric motor spins.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 66, 98, 'Motor running properly', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (99, 45, 'Debris / damaged fan wheel present', 'A leaf or twig inside the cage causes intense rotational vibration and buzzing through the dashboard.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 67, 99, 'Debris / damaged fan wheel present', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (100, 45, 'Clean and intact motor cage', 'Cage is balanced and clean.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 68, 100, 'Clean and intact motor cage', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (101, 46, 'Resistor failure / open circuit on lower speeds', 'Thermal cutoff fuse blown because lower speeds use resistive coils that drop voltage through heat.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 69, 101, 'Resistor failure / open circuit on lower speeds', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (102, 46, 'Resistor working properly with normal continuity', 'Resistance steps are intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 70, 102, 'Resistor working properly with normal continuity', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (103, 47, 'Overheated / melted connector pins', 'High electrical resistance at terminal pins melts plastic plug, causing intermittent fan cutouts.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 71, 103, 'Overheated / melted connector pins', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (104, 47, 'Good condition resistor and clean plug', 'Electrical terminals show no signs of overheating.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 72, 104, 'Good condition resistor and clean plug', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (105, 48, 'Low / empty / muddy brown coolant', 'Fluid loss starves the engine cylinder head of heat transfer liquid, causing rapid catastrophic overheating.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 73, 105, 'Low / empty / muddy brown coolant', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (106, 48, 'Sufficient & clean coolant between MIN and MAX', 'Reservoir fluid volume is adequate.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 74, 106, 'Sufficient & clean coolant between MIN and MAX', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (107, 49, 'Cracked / leaking reservoir or venting cap', 'Plastic becomes brittle from heat cycles. A leaking cap fails to hold the 1.2 to 1.4 bar pressure required to raise boiling point.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 75, 107, 'Cracked / leaking reservoir or venting cap', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (108, 49, 'Intact reservoir and tight cap seal', 'Tank holds pressure.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 76, 108, 'Intact reservoir and tight cap seal', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (109, 50, 'Gauge needle drops (leaking system)', 'Pressure decay indicates an active external hose/radiator leak or internal head gasket breach.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 77, 109, 'Gauge needle drops (leaking system)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (110, 50, 'Pressure holds steady (no leaks detected)', 'Circuit is hermetically sealed under static pressure.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 78, 110, 'Pressure holds steady (no leaks detected)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (111, 51, 'Leaking component found (radiator, hose, or water pump)', 'Identified the leaking component responsible for coolant loss.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 79, 111, 'Leaking component found (radiator, hose, or water pump)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (112, 51, 'All external components dry and intact', 'External circuit is tight. If coolant is vanishing, internal head gasket leak suspected.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 80, 112, 'All external components dry and intact', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (113, 52, 'Blocked / damaged radiator core', 'External debris prevents ambient air from cooling the engine coolant passing through tubes.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 81, 113, 'Blocked / damaged radiator core', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (114, 52, 'Clear & intact radiator core', 'Air passages are open.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 82, 114, 'Clear & intact radiator core', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (115, 53, 'Faulty thermostat (stuck closed: upper hose cold while engine boiling)', 'Thermostat wax pellet has failed, trapping hot coolant inside engine block without radiator circulation.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 83, 115, 'Faulty thermostat (stuck closed: upper hose cold while engine boiling)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (116, 53, 'Thermostat functioning properly (hose warms up smoothly at ~90??C)', 'Thermostat valve opens and closes at specified temperature threshold.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 84, 116, 'Thermostat functioning properly (hose warms up smoothly at ~90??C)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (117, 54, 'Leaking heater core (wet carpet & greasy windshield fog)', 'The mini-radiator inside the dashboard has developed a tube crack or tank leak.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 85, 117, 'Leaking heater core (wet carpet & greasy windshield fog)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (118, 54, 'No leaks detected in cabin', 'Heater core is dry and leak-free.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 86, 118, 'No leaks detected in cabin', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (119, 55, 'Restricted flow (inlet hose burning hot, outlet hose cold)', 'Heater core tubes are clogged with scale, rust or stop-leak additive, starving the cabin of heat.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 87, 119, 'Restricted flow (inlet hose burning hot, outlet hose cold)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (120, 55, 'Good coolant flow (both hoses uniformly hot)', 'Coolant circulation through core is unimpeded.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 88, 120, 'Good coolant flow (both hoses uniformly hot)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (121, 56, 'Fan not spinning', 'Electric fan motor failure, blown 40A high-power fuse, or open cooling fan relay.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 89, 121, 'Fan not spinning', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (122, 56, 'Fan operates correctly with strong airflow', 'Fan motor and basic drive circuit work.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 90, 122, 'Fan operates correctly with strong airflow', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (123, 57, 'Faulty motor / relay or burned dropping resistor', 'Burned relay contacts or open low-speed resistor prevent fan from engaging when temperature climbs.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 91, 123, 'Faulty motor / relay or burned dropping resistor', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (124, 57, 'Motor and relay functioning properly', 'Fan electrical controls are functional.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 92, 124, 'Motor and relay functioning properly', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (125, 58, 'Damaged, soft, swollen or cracked hoses found', 'Internal fabric reinforcement degraded. Engine oil dripping from valve cover softens EPDM rubber rapidly.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 93, 125, 'Damaged, soft, swollen or cracked hoses found', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (126, 58, 'Hoses are firm, pliable and in good condition', 'Rubber hose walls are structurally sound.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 94, 126, 'Hoses are firm, pliable and in good condition', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (127, 59, 'Leaking connections / crusty buildup around clamps', 'Weakened spring clamp or cracked plastic radiator hose neck weeping coolant under thermal expansion.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 95, 127, 'Leaking connections / crusty buildup around clamps', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (128, 59, 'No leaks detected at joints', 'Connections are tight and dry.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 96, 128, 'No leaks detected at joints', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (129, 60, 'Leaking pump (wet coolant or crusty trail from weep hole)', 'Internal mechanical carbon-ceramic face seal has failed, allowing pressurized coolant to escape through the bearing chamber.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 97, 129, 'Leaking pump (wet coolant or crusty trail from weep hole)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (130, 60, 'Dry weep hole with no leaks detected', 'Mechanical shaft seal is holding pressure.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 98, 130, 'Dry weep hole with no leaks detected', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (131, 61, 'Faulty pump (loose wobbly bearing or plastic impeller slipping on shaft)', 'Bearing wear or cracked plastic impeller frees the shaft from pumping, halting all coolant circulation.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 99, 131, 'Faulty pump (loose wobbly bearing or plastic impeller slipping on shaft)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (132, 61, 'Pump working correctly with steady return stream', 'Impeller is circulating coolant normally.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 100, 132, 'Pump working correctly with steady return stream', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (133, 62, 'Irregular / dripping / clogged spray pattern', 'Carbon deposits choke injector pintle nozzles, resulting in fuel droplets instead of fine atomized mist.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 101, 133, 'Irregular / dripping / clogged spray pattern', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (134, 62, 'Uniform conical atomized spray pattern', 'Fuel atomization is optimal.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 102, 134, 'Uniform conical atomized spray pattern', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (135, 63, 'Open circuit / out of tolerance / external O-ring leak', 'Burned solenoid coil prevents valve from opening, producing an immediate cylinder misfire (P0300/P030X).', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 103, 135, 'Open circuit / out of tolerance / external O-ring leak', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (136, 63, 'In-tolerance coil resistance & clean injector', 'Injector solenoid is electrically functional.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 104, 136, 'In-tolerance coil resistance & clean injector', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (137, 64, 'Regulator malfunction (liquid fuel in vacuum hose)', 'Torn internal rubber diaphragm allows pressurized fuel to be sucked straight into intake manifold, running extremely rich.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 105, 137, 'Regulator malfunction (liquid fuel in vacuum hose)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (138, 64, 'Dry vacuum port with no trace of fuel', 'Diaphragm is intact and holding seal.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 106, 138, 'Dry vacuum port with no trace of fuel', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (139, 65, 'Abnormally high or low pressure', 'Internal spring weak (too low) or return line orifice jammed shut (excessive pressure causes rich codes).', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 107, 139, 'Abnormally high or low pressure', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (140, 65, 'Correct specification pressure holding steady', 'Pressure regulation is within OEM tolerances.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 108, 140, 'Correct specification pressure holding steady', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (141, 66, 'Low pressure / no fuel flow / pressure drops under load', 'Worn pump motor commutator, burned brushes, or clogged in-tank sock filter.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 109, 141, 'Low pressure / no fuel flow / pressure drops under load', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (142, 66, 'Normal pressure and strong volume flow', 'Pump delivers correct flow and pressure head.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 110, 142, 'Normal pressure and strong volume flow', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (143, 67, 'Leaking flange / melted electrical connector', 'High current draw through corroded terminals melts top flange socket, causing intermittent pump shutdown.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 111, 143, 'Leaking flange / melted electrical connector', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (144, 67, 'Clean, intact and sealed pump housing', 'Flange seals and electrical connector are intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 112, 144, 'Clean, intact and sealed pump housing', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (145, 68, 'Leaking / damaged / rusted tank or filler neck', 'Road salt rots steel filler pipes, allowing fuel to splash out during fueling and moisture into fuel.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 113, 145, 'Leaking / damaged / rusted tank or filler neck', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (146, 68, 'Tank and filler neck in good condition', 'Tank body is intact and sealed.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 114, 146, 'Tank and filler neck in good condition', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (147, 69, 'Loose / broken / cracked cap seal', 'Vents fuel vapor into atmosphere, triggering Check Engine EVAP leak code (P0440 / P0455).', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 115, 147, 'Loose / broken / cracked cap seal', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (148, 69, 'Cap seals properly with firm ratchet click', 'Gas cap seals vapor tightly.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 116, 148, 'Cap seals properly with firm ratchet click', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (149, 70, 'Clogged / dirty filter with black sediment', 'Trapped dirt and water create a severe restriction, starving high-RPM fuel demand.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 117, 149, 'Clogged / dirty filter with black sediment', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (150, 70, 'Clean filter recently replaced', 'Fuel filter flow capacity is adequate.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 118, 150, 'Clean filter recently replaced', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (151, 71, 'Replace filter (exceeded 60,000 km or restricted)', 'Preventive replacement restores full unrestricted flow to fuel rail.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 119, 151, 'Replace filter (exceeded 60,000 km or restricted)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (152, 71, 'Filter in good condition', 'Filter is within service lifespan.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 120, 152, 'Filter in good condition', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (153, 72, 'Worn / damaged / oil-soaked / stripped belt teeth', 'Degraded rubber can slip teeth on camshaft sprocket or snap entirely during cranking.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 121, 153, 'Worn / damaged / oil-soaked / stripped belt teeth', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (154, 72, 'Belt in good condition with crisp teeth and clean backing', 'Belt physical integrity appears intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 122, 154, 'Belt in good condition with crisp teeth and clean backing', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (155, 73, 'Misaligned timing marks (belt has jumped 1 or more teeth)', 'Jumped timing causes valve timing overlap error, loss of cylinder compression, and backfiring.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 123, 155, 'Misaligned timing marks (belt has jumped 1 or more teeth)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (156, 73, 'Properly aligned timing marks', 'Engine mechanical synchronization is correct.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 124, 156, 'Properly aligned timing marks', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (157, 74, 'Cut / worn / glazed / shredded belt', 'Glazed belt slips on alternator and water pump pulleys, causing loud squealing and loss of charging.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 125, 157, 'Cut / worn / glazed / shredded belt', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (158, 74, 'Belt in good condition with clean flexible rubber', 'Belt rubber is sound.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 126, 158, 'Belt in good condition with clean flexible rubber', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (159, 75, 'Loose / misaligned belt or chattering tensioner', 'Weak internal tensioner spring or seized decoupler alternator pulley (OAP) causes belt flutter and thrown belts.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 127, 159, 'Loose / misaligned belt or chattering tensioner', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (160, 75, 'Properly tensioned and aligned belt running true', 'Tension and alignment are correct.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 128, 160, 'Properly tensioned and aligned belt running true', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (161, 76, 'Low boost pressure (underboost condition P0299)', 'Charge air leak in boost hoses, stuck open wastegate, or seized variable geometry vanes (VNT).', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 129, 161, 'Low boost pressure (underboost condition P0299)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (162, 76, 'Normal boost pressure tracking requested target', 'Turbo pressure build-up matches ECU target.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 130, 162, 'Normal boost pressure tracking requested target', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (163, 77, 'Leaking / split / damaged intercooler or ruptured boost hose', 'Boost air vents to atmosphere, causing loss of power, whooshing air noise under load, and excessive fuel smoke.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 131, 163, 'Leaking / split / damaged intercooler or ruptured boost hose', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (164, 77, 'Intact intercooler holding full boost pressure', 'Charge air piping is airtight.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 132, 164, 'Intact intercooler holding full boost pressure', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (165, 78, 'High resistance / infinite ohms (open circuit burned element)', 'Heating coil burned open, preventing cylinder preheating needed for cold diesel auto-ignition.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 133, 165, 'High resistance / infinite ohms (open circuit burned element)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (166, 78, 'Normal low resistance (0.6 - 1.2 ohms)', 'Heating element is intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 134, 166, 'Normal low resistance (0.6 - 1.2 ohms)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (167, 79, 'Heavy carbon buildup / eroded or swollen tip', 'Dripping fuel injector or excessive EGR soot coats plug, insulating heat from combustion chamber.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 135, 167, 'Heavy carbon buildup / eroded or swollen tip', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (168, 79, 'Clean plug tip with light grey ash', 'Combustion conditions are healthy.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 136, 168, 'Clean plug tip with light grey ash', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (169, 80, 'Worn / torn rubber or leaking hydraulic mount oil', 'Internal hydraulic damping fluid has leaked out or rubber web is severed, transferring harsh engine vibration directly to chassis.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 137, 169, 'Worn / torn rubber or leaking hydraulic mount oil', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (170, 80, 'Mounts in good condition with firm pliable rubber', 'Rubber and hydraulic dampening are intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 138, 170, 'Mounts in good condition with firm pliable rubber', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (171, 81, 'Loose or sheared mounting bolts', 'Loose bolts allow aluminum bracket to clunk against steel chassis unibody rail during acceleration.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 139, 171, 'Loose or sheared mounting bolts', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (172, 81, 'Tight bolts torqued to specification', 'Bolts are secure.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 140, 172, 'Tight bolts torqued to specification', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (173, 82, 'Leaking gasket / oil in spark plug tubes', 'Hardened rubber gasket loses elasticity from heat cycles, leaking oil down engine block and into spark plug wells.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 141, 173, 'Leaking gasket / oil in spark plug tubes', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (174, 82, 'Dry perimeter with good gasket seal', 'Valve cover perimeter is oil tight.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 142, 174, 'Dry perimeter with good gasket seal', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (175, 83, 'Loose bolts or cracked plastic cover', 'Vibrations loosen bolts over time, or overtightening cracks the plastic valve cover.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 143, 175, 'Loose bolts or cracked plastic cover', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (176, 83, 'Tight bolts torqued evenly', 'Bolts are secure.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 144, 176, 'Tight bolts torqued evenly', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (177, 84, 'Low oil pressure (under 1.0 bar hot idle)', 'Worn oil pump internal gears, clogged oil pickup strainer screen (sludge), or excessive bearing clearances.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 145, 177, 'Low oil pressure (under 1.0 bar hot idle)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (178, 84, 'Normal oil pressure conforming to manufacturer specs', 'Hydraulic oil lubrication pressure is healthy.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 146, 178, 'Normal oil pressure conforming to manufacturer specs', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (179, 85, 'Worn pump / relief valve stuck open / damaged drive', 'Relief valve stuck open bleeds pressurized oil straight back to pan without feeding engine galleries.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 147, 179, 'Worn pump / relief valve stuck open / damaged drive', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (180, 85, 'Pump in good condition with free-moving relief valve', 'Pump internals are sound.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 148, 180, 'Pump in good condition with free-moving relief valve', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (181, 86, 'Low compression on one or more cylinders (below 9 bar)', 'Worn compression rings, scored cylinder walls, or burned valves allow combustion pressure to leak.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 149, 181, 'Low compression on one or more cylinders (below 9 bar)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (182, 86, 'Good compression uniform across all cylinders (within 10%)', 'Piston rings and valve seating are sealing effectively.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 150, 182, 'Good compression uniform across all cylinders (within 10%)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (183, 87, 'Violent blow-by / cap blown off with visible smoke puffing', 'Combustion gases leaking past worn piston rings pressurize the engine crankcase, pushing oil out through seals.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 151, 183, 'Violent blow-by / cap blown off with visible smoke puffing', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (184, 87, 'Slight vacuum or gentle vibration holding cap down', 'Crankcase pressure is well controlled.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 152, 184, 'Slight vacuum or gentle vibration holding cap down', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (185, 88, 'Internal rattle / physical impact dent or cracked welds', 'Thermal shock or misfire fuel ignition melted and shattered the precious metal ceramic monolith.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 153, 185, 'Internal rattle / physical impact dent or cracked welds', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (186, 88, 'Converter intact with solid sound', 'Ceramic core is physically in place.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 154, 186, 'Converter intact with solid sound', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (187, 89, 'Low efficiency (downstream sensor mirrors upstream switching - P0420)', 'The catalyst has lost oxygen storage capacity and can no longer reduce CO, NOx, and HC pollutants.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 155, 187, 'Low efficiency (downstream sensor mirrors upstream switching - P0420)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (188, 89, 'High efficiency with stable downstream O2 signal', 'Catalytic oxidation and reduction are functioning properly.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 156, 188, 'High efficiency with stable downstream O2 signal', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (189, 90, 'Low voltage / lazy switching / stuck flatlined signal', 'Zirconia sensor element is poisoned by silicone, lead, or heavy carbon soot, causing sluggish or dead response.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 157, 189, 'Low voltage / lazy switching / stuck flatlined signal', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (190, 90, 'Normal fast voltage switching (0.1V to 0.9V cycle)', 'Sensor reads exhaust gas oxygen content accurately.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 158, 190, 'Normal fast voltage switching (0.1V to 0.9V cycle)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (191, 91, 'Damaged / melted wiring or open heater circuit', 'Melted wires ground out or internal heating element burned, preventing sensor from reaching its 350??C operating temperature.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 159, 191, 'Damaged / melted wiring or open heater circuit', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (192, 91, 'Intact wiring harness and good heater resistance', 'Electrical circuit is in good order.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 160, 192, 'Intact wiring harness and good heater resistance', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (193, 92, 'Valve stuck open (air flows freely through valve unpowered)', 'Solenoid stuck open sucks raw fuel vapor and unmetered air directly into intake manifold, flooding the engine right after refueling.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 161, 193, 'Valve stuck open (air flows freely through valve unpowered)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (194, 92, 'Valve operates correctly (100% airtight when unpowered)', 'Internal solenoid seat seals airtight.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 162, 194, 'Valve operates correctly (100% airtight when unpowered)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (195, 93, 'Leaking / split / disconnected vapor hoses', 'Cracked vapor hose leaks fuel fumes into engine bay and triggers EVAP gross leak code.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 163, 195, 'Leaking / split / disconnected vapor hoses', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (196, 93, 'No leaks found in vacuum lines', 'Lines are sealed.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 164, 196, 'No leaks found in vacuum lines', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (197, 94, 'Cracked manifold or leaking gasket with visible black soot', 'Extreme thermal cycling cracks cast iron, producing a sharp rhythmic "tick-tick" noise that mimics valve train lifter tap.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 165, 197, 'Cracked manifold or leaking gasket with visible black soot', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (198, 94, 'Intact manifold without cracks or soot', 'Manifold body is structurally sound.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 166, 198, 'Intact manifold without cracks or soot', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (199, 95, 'Loose bolts or broken / missing stud heads', 'Thermal expansion shears the end studs, lifting the flange and allowing exhaust gas to blast past the gasket.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 167, 199, 'Loose bolts or broken / missing stud heads', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (200, 95, 'All bolts tight and torqued to spec', 'Manifold flange is clamped evenly.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 168, 200, 'All bolts tight and torqued to spec', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (201, 96, 'Voltage stuck / low voltage / out of range', 'Internal silicon diaphragm contaminated with oil sludge or piezoresistive circuit failed.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 169, 201, 'Voltage stuck / low voltage / out of range', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (202, 96, 'Normal voltage responding instantly to throttle blips', 'MAP sensor electronic response is normal.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 170, 202, 'Normal voltage responding instantly to throttle blips', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (203, 97, 'Leaking / cracked hose or flattened O-ring', 'Vacuum leak causes false high pressure reading, tricking ECU into injecting far too much fuel.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 171, 203, 'Leaking / cracked hose or flattened O-ring', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (204, 97, 'Intact hose with airtight seal', 'Vacuum connection is airtight.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 172, 204, 'Intact hose with airtight seal', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (205, 98, 'Low voltage (resting < 12.2V or cranking drops below 9.0V)', 'Sulfated lead plates or bad cells cannot provide the 300A-500A required by the starter motor.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 173, 205, 'Low voltage (resting < 12.2V or cranking drops below 9.0V)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (206, 98, 'Sufficient voltage (12.6V resting, holds > 10.0V cranking)', 'Battery charge state and internal resistance are healthy.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 174, 206, 'Sufficient voltage (12.6V resting, holds > 10.0V cranking)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (207, 99, 'Corroded / loose terminals', 'Lead sulfate powder creates high contact resistance, cutting starter motor current and clicking starter solenoid.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 175, 207, 'Corroded / loose terminals', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (208, 99, 'Clean, tight terminals with bare metal contact', 'Electrical connection to battery posts is clean.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 176, 208, 'Clean, tight terminals with bare metal contact', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (209, 100, 'Low output (below 13.5V engine running) or overcharging (> 15.2V)', 'Worn alternator carbon brushes, blown diode rectifier bridge, or failed internal voltage regulator.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 177, 209, 'Low output (below 13.5V engine running) or overcharging (> 15.2V)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (210, 100, 'Normal output (solid 13.8V to 14.4V)', 'Alternator is charging battery and carrying electrical load.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 178, 210, 'Normal output (solid 13.8V to 14.4V)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (211, 101, 'Loose / slipping belt', 'Slipping belt cannot spin alternator fast enough to produce required amperage under load.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 179, 211, 'Loose / slipping belt', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (212, 101, 'Properly tensioned belt with no slip', 'Belt drive is transferring full mechanical power.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 180, 212, 'Properly tensioned belt with no slip', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (213, 102, 'Faulty solenoid (12V trigger present but starter clicks or does nothing)', 'Burned copper contact disc inside solenoid prevents main battery current from reaching starter motor windings.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 181, 213, 'Faulty solenoid (12V trigger present but starter clicks or does nothing)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (214, 102, 'Solenoid working properly and engaging', 'Electrical solenoid engagement is functional.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 182, 214, 'Solenoid working properly and engaging', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (215, 103, 'Worn brushes or slipping bendix drive gear', 'Worn carbon brushes no longer make contact with commutator, creating an open circuit dead spot.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 183, 215, 'Worn brushes or slipping bendix drive gear', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (216, 103, 'Brushes in good condition and bendix teeth intact', 'Starter internal mechanics are sound.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 184, 216, 'Brushes in good condition and bendix teeth intact', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (217, 104, 'Cracked / damaged cap / carbon tracks on coil boots', 'High voltage spark flashes over carbon tracks directly to engine block rather than firing inside spark plug gap.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 185, 217, 'Cracked / damaged cap / carbon tracks on coil boots', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (218, 104, 'Cap & boots in good condition without tracking', 'Insulation is clean and intact.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 186, 218, 'Cap & boots in good condition without tracking', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (219, 105, 'Broken wire / resistance over 25k?? or punctured boot', 'Internal carbon conductive core broken, creating high resistance and weak spark that blows out under compression.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 187, 219, 'Broken wire / resistance over 25k?? or punctured boot', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (220, 105, 'Wires intact with uniform resistance', 'High voltage wire continuity is healthy.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 188, 220, 'Wires intact with uniform resistance', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (221, 106, 'No power to window motor', 'Broken wires in flexible door jamb rubber boot accordion, blown window fuse, or faulty master window switch.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 189, 221, 'No power to window motor', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (222, 106, 'Power and ground present when switch pressed', 'Switch and wiring deliver full battery voltage.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 190, 222, 'Power and ground present when switch pressed', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (223, 107, 'Damaged regulator / snapped cable / broken plastic clips', 'Steel cable frayed and jammed around motor spool, causing glass to drop down into door or freeze stuck.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 191, 223, 'Damaged regulator / snapped cable / broken plastic clips', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (224, 107, 'Mechanism functioning freely and intact', 'Cables and tracks are aligned.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 192, 224, 'Mechanism functioning freely and intact', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (225, 108, 'Burnt out / broken filament or black bulb glass', 'Filament reached end of lifespan (approx 500-800 hours for standard halogens).', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 193, 225, 'Burnt out / broken filament or black bulb glass', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (226, 108, 'Filament intact and continuous', 'Bulb filament is complete.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 194, 226, 'Filament intact and continuous', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (227, 109, 'Corroded / melted socket connector', 'High electrical resistance generates extreme heat at connector pins, melting socket and causing intermittent lighting.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 195, 227, 'Corroded / melted socket connector', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (228, 109, 'Clean socket with tight terminal tension', 'Socket contact is sound.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 196, 228, 'Clean socket with tight terminal tension', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (229, 110, 'No power to wiper motor', 'Blown 25A/30A wiper fuse (often blown when wipers frozen to glass in winter), bad relay, or steering column stalk switch failure.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 197, 229, 'No power to wiper motor', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (230, 110, 'Power present at motor connector on all speed settings', 'Electrical feed is operational.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 198, 230, 'Power present at motor connector on all speed settings', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (231, 111, 'Worn / popped off linkage ball joint or seized pivot shafts', 'Road grime seizes the pivot shafts or plastic ball socket wears out, detaching the arms from the motor crank.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 199, 231, 'Worn / popped off linkage ball joint or seized pivot shafts', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (232, 111, 'Intact linkage connected securely to motor arm', 'Mechanical rods are firmly coupled.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 200, 232, 'Intact linkage connected securely to motor arm', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (233, 112, 'Leaking cylinder (wet brake fluid on pedal arm / carpet)', 'Internal piston seal worn, letting fluid leak into cabin and introducing air bubbles into hydraulic line.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 201, 233, 'Leaking cylinder (wet brake fluid on pedal arm / carpet)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (234, 112, 'Dry pushrod and intact cylinder casing', 'Master cylinder shows no signs of external leakage.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 202, 234, 'Dry pushrod and intact cylinder casing', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (235, 113, 'Leaking slave cylinder or low fluid level', 'Slave cylinder piston seal failure loses pressure to throwout bearing, preventing clutch disengagement.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 203, 235, 'Leaking slave cylinder or low fluid level', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (236, 113, 'No leaks detected and fluid level is full', 'Hydraulic cylinders are holding pressure.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 204, 236, 'No leaks detected and fluid level is full', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (237, 114, 'Low / dirty / burned black fluid', 'Low fluid level starves hydraulic pump, causing clutch slip and delayed gear engagements.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 205, 237, 'Low / dirty / burned black fluid', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (238, 114, 'Clean, translucent red / amber fluid at correct level', 'Fluid level and hydraulic properties are adequate.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 206, 238, 'Clean, translucent red / amber fluid at correct level', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (239, 115, 'Clogged filter / heavy metal shavings on magnet / pan leak', 'Clogged suction filter restricts oil flow to valve body; metal flakes indicate mechanical clutch or planetary wear.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 207, 239, 'Clogged filter / heavy metal shavings on magnet / pan leak', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (240, 115, 'Clean filter and dry transmission pan', 'No abnormal metal debris or pan leaks found.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 208, 240, 'Clean filter and dry transmission pan', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (241, 116, 'Worn / sloppy play detected or torn rubber boot slinging grease', 'Needle bearings crushed from lack of grease, producing severe driveline vibration and clunking.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 209, 241, 'Worn / sloppy play detected or torn rubber boot slinging grease', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (242, 116, 'Joint in good condition with zero radial play', 'Universal joints and CV joints are tight.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 210, 242, 'Joint in good condition with zero radial play', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (243, 117, 'Torn center support bearing or missing balance weight', 'Driveshaft whips under rotational speed, transmitting high-frequency vibration through vehicle floor.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 211, 243, 'Torn center support bearing or missing balance weight', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (244, 117, 'Properly aligned and balanced driveline', 'Driveline balance and support are correct.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 212, 244, 'Properly aligned and balanced driveline', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (245, 118, 'Low / dirty / metallic silver gear oil', 'Oil starvation or breakdown causes ring and pinion bevel gear teeth to gall and whine under acceleration.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 213, 245, 'Low / dirty / metallic silver gear oil', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (246, 118, 'Clean and sufficient fluid level', 'Lubrication level is correct.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 214, 246, 'Clean and sufficient fluid level', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (247, 119, 'Worn bearings / excessive radial play or pitted gear teeth', 'Pinion bearings worn out, changing gear contact pattern and generating distinctive howling whine.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 215, 247, 'Worn bearings / excessive radial play or pitted gear teeth', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (248, 119, 'Bearings in good condition with tight tolerances', 'Differential bearings are tight.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 216, 248, 'Bearings in good condition with tight tolerances', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (249, 120, 'Low fluid level / aerated frothy foam', 'Low fluid draws air into pump vanes (cavitation), creating loud whining noise and steering stiffness.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 217, 249, 'Low fluid level / aerated frothy foam', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (250, 120, 'Sufficient clean fluid level without air bubbles', 'Hydraulic fluid level is optimal.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 218, 250, 'Sufficient clean fluid level without air bubbles', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (251, 121, 'Leaking pump / crimp hose / rack seal leak', 'Cracked high pressure line or leaking steering rack end seals vent hydraulic pressure.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 219, 251, 'Leaking pump / crimp hose / rack seal leak', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (252, 121, 'Pump and hoses in good dry condition', 'System is sealed and leak-free.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 220, 252, 'Pump and hoses in good dry condition', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (253, 122, 'Loose / clunking / worn bearing with noticeable play', 'Internal steel ball/roller bearings and races are pitted and worn, creating dangerous free play.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 221, 253, 'Loose / clunking / worn bearing with noticeable play', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (254, 122, 'Bearing in good condition with zero free play', 'Bearing assembly is tight.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 222, 254, 'Bearing in good condition with zero free play', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (255, 123, 'Rough growling spin / vibration felt through suspension spring', 'Spalling of bearing race creates roaring vibration transferred through knuckle and strut.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 223, 255, 'Rough growling spin / vibration felt through suspension spring', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (256, 123, 'Smooth, silent spin without vibration', 'Bearing rolls silently.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 224, 256, 'Smooth, silent spin without vibration', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (257, 124, 'Low / incorrect tire pressure detected (below threshold)', 'Puncture, slow nail leak, or seasonal cold weather dropped pressure below 25% safety threshold.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 225, 257, 'Low / incorrect tire pressure detected (below threshold)', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (258, 124, 'All tire pressures correct and matched', 'Tire inflation pressures match factory specifications.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 226, 258, 'All tire pressures correct and matched', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (259, 125, 'Dead sensor battery / damaged / corroded valve stem', 'Internal lithium coin cell dead or aluminum valve stem cracked from road salt corrosion.', 'alert', 1, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 227, 259, 'Dead sensor battery / damaged / corroded valve stem', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);
INSERT INTO answer_options (id, question_id, label, subtitle, icon, is_default, order_index)
VALUES (260, 125, 'Clean, intact sensors transmitting strong RF signal', 'TPMS sensors are broadcasting pressure and temperature data.', 'check', 0, 1)
ON DUPLICATE KEY UPDATE label = VALUES(label);
INSERT INTO legacy_id_map (entity_type, old_id, new_id, legacy_name, notes)
VALUES ('answer_option', 228, 260, 'Clean, intact sensors transmitting strong RF signal', 'Migrated option from question_options table')
ON DUPLICATE KEY UPDATE new_id = VALUES(new_id);

-- 4. Insertion des 110 règles déterministes dans diagnostic_rules (via legacy_id_map)
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 102, 16, 41, new_id, 'reinforce', 15, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 4
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 103, 17, 43, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 4
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 104, 18, 45, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 5
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 105, 19, 47, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 5
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 106, 20, 49, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 6
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 107, 21, 51, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 6
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 108, 22, 53, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 7
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 109, 23, 55, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 7
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 110, 24, 57, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 8
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 111, 25, 59, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 8
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 112, 26, 61, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 9
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 113, 27, 63, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 9
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 114, 28, 65, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 10
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 115, 29, 67, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 10
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 116, 30, 69, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 11
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 117, 31, 71, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 11
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 118, 32, 73, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 12
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 119, 33, 75, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 12
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 120, 34, 77, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 13
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 121, 35, 79, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 13
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 122, 36, 81, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 14
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 123, 37, 83, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 14
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 124, 38, 85, new_id, 'reinforce', 16, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 15
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 125, 39, 87, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 15
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 126, 40, 89, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 16
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 127, 41, 91, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 16
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 128, 42, 93, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 17
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 129, 43, 95, new_id, 'reinforce', 15, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 17
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 130, 44, 97, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 18
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 131, 45, 99, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 18
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 132, 46, 101, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 19
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 133, 47, 103, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 19
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 134, 48, 105, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 20
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 135, 49, 107, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 20
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 136, 50, 109, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 21
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 137, 51, 111, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 21
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 138, 52, 113, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 22
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 139, 53, 115, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 22
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 140, 54, 117, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 23
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 141, 55, 119, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 23
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 142, 56, 121, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 24
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 143, 57, 123, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 24
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 144, 58, 125, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 25
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 145, 59, 127, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 25
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 146, 60, 129, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 26
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 147, 61, 131, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 26
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 148, 62, 133, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 27
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 149, 63, 135, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 27
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 150, 64, 137, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 28
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 151, 65, 139, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 28
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 152, 66, 141, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 29
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 153, 67, 143, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 29
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 154, 68, 145, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 30
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 155, 69, 147, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 30
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 156, 70, 149, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 31
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 157, 71, 151, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 31
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 158, 72, 153, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 32
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 159, 73, 155, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 32
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 160, 74, 157, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 33
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 161, 75, 159, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 33
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 162, 76, 161, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 34
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 163, 77, 163, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 34
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 164, 78, 165, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 35
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 165, 79, 167, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 35
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 166, 80, 169, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 36
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 167, 81, 171, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 36
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 168, 82, 173, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 37
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 169, 83, 175, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 37
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 170, 84, 177, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 38
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 171, 85, 179, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 38
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 172, 86, 181, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 39
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 173, 87, 183, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 39
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 174, 88, 185, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 40
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 175, 89, 187, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 40
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 176, 90, 189, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 41
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 177, 91, 191, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 41
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 178, 92, 193, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 42
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 179, 93, 195, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 42
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 180, 94, 197, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 43
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 181, 95, 199, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 43
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 182, 96, 201, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 44
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 183, 97, 203, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 44
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 184, 98, 205, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 45
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 185, 99, 207, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 45
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 186, 100, 209, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 46
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 187, 101, 211, new_id, 'reinforce', 18, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 46
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 188, 102, 213, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 47
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 189, 103, 215, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 47
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 190, 104, 217, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 48
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 191, 105, 219, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 48
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 192, 106, 221, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 49
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 193, 107, 223, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 49
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 194, 108, 225, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 50
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 195, 109, 227, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 50
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 196, 110, 229, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 51
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 197, 111, 231, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 51
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 198, 112, 233, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 52
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 199, 113, 235, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 52
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 200, 114, 237, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 53
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 201, 115, 239, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 53
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 202, 116, 241, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 54
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 203, 117, 243, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 54
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 204, 118, 245, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 55
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 205, 119, 247, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 55
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 206, 120, 249, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 56
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 207, 121, 251, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 56
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 208, 122, 253, new_id, 'reinforce', 25, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 57
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 209, 123, 255, new_id, 'reinforce', 24, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 57
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 210, 124, 257, new_id, 'reinforce', 22, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 58
ON DUPLICATE KEY UPDATE weight = VALUES(weight);
INSERT INTO diagnostic_rules (id, question_id, answer_option_id, fault_id, effect, weight, next_question_id, source_record_id, notes)
SELECT 211, 125, 259, new_id, 'reinforce', 20, NULL, NULL, 'Migrated rule from hypothesis_weights'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 58
ON DUPLICATE KEY UPDATE weight = VALUES(weight);

-- 4b. Association des 39 pannes aux symptômes dans fault_symptoms
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 26, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 20
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 27, 85.00, 0, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 21
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 28, 85.00, 0, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 22
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 29, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 23
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 30, 85.00, 0, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 24
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 31, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 25
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 32, 85.00, 0, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 26
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 33, 85.00, 0, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 27
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 34, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 28
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 35, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 29
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 36, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 30
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 37, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 31
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 38, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 32
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 39, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 33
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 40, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 34
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 41, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 35
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 42, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 36
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 43, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 37
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 44, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 38
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 45, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 39
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 46, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 40
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 47, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 41
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 48, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 42
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 49, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 43
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 50, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 44
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 51, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 45
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 52, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 46
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 53, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 47
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 54, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 48
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 55, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 49
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 56, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 50
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 57, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 51
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 58, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 52
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 59, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 53
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 60, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 54
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 61, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 55
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 62, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 56
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 63, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 57
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);
INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
SELECT new_id, 64, 85.00, 1, 'reported'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 58
ON DUPLICATE KEY UPDATE relevance_score = VALUES(relevance_score);

-- 5. Insertion des solutions et tests pour les 28 pannes créées (via legacy_id_map)
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 20, new_id, 'Coolant Level Top-up & Expansion Tank Inspection', 'Inspection and repair guide for Coolant Level & Expansion Tank', 'intermediate', '15 min', 90, 220, 'Wait at least 45 minutes after driving before opening the cooling system cap.', '["Funnel","Clean rag","Premixed 50/50 coolant"]', '[{"step":1,"title":"Confirm Engine Cold","description":"Touch upper radiator hose; if it feels hot or pressurized like a firm tire, wait for it to cool.","time_est":"15 min","caution":null},{"step":2,"title":"Slowly Unscrew Cap with Towel","description":"Place thick towel over cap and turn counterclockwise to first detent to release any residual pressure hiss, then remove.","time_est":"15 min","caution":null},{"step":3,"title":"Fill to MAX Mark","description":"Pour correct specification coolant to MAX line. Do not overfill, as expansion space is required when hot.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 20
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 20, new_id, 'Test de confirmation : Batterie en fin de vie chimique (> 4 ans)', 'Lecture de date', 'V??rifier la date de fabrication grav??e sur le bo??tier.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 20
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 21, new_id, 'Cooling Leak Tracing & Puddle Identification', 'Inspection and repair guide for Cooling System Leak Detection', 'hard', '25 min', 280, 580, 'Coolant has a sweet taste and is extremely toxic to pets. Clean all spills immediately.', '["Cardboard sheet","Flashlight","Pressure test kit"]', '[{"step":1,"title":"Place White Cardboard Under Engine","description":"Park on clean pavement, slide cardboard under engine bay, and let sit overnight to spot drip locations.","time_est":"25 min","caution":null},{"step":2,"title":"Identify Fluid","description":"Coolant feels slippery like watered syrup with sweet smell, unlike clear water (AC condensation) or black oil.","time_est":"25 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 21
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 21, new_id, 'Test de confirmation : Alternateur hors service (R??gulateur ou charbons)', 'Observation du voyant batterie', 'Noter si le t??moin rouge de batterie s''allume pendant que le moteur tourne.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 21
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 22, new_id, 'Thermostat Replacement & Air Bleeding', 'Inspection and repair guide for Engine Thermostat', 'easy', '1 hour', 50, 150, 'Air pockets in the cylinder head can cause hot spots and engine failure. Always bleed air properly.', '["10mm socket / ratchet","Hose clamp pliers","Catch drain pan","New thermostat with gasket"]', '[{"step":1,"title":"Drain 2 Liters of Coolant","description":"Open radiator drain petcock to lower coolant level below the thermostat housing.","time_est":"1 hour","caution":null},{"step":2,"title":"Unbolt Thermostat Housing","description":"Remove 2 to 3 bolts securing the water neck, pull out old thermostat, note jiggle pin orientation.","time_est":"1 hour","caution":null},{"step":3,"title":"Install New Unit with Jiggle Pin at 12 O???clock","description":"Fit new rubber O-ring seal, torque bolts to 10 Nm, refill and open air bleed screws until solid stream flows.","time_est":"1 hour","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 22
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 22, new_id, 'Test de confirmation : Consommateur parasite ?? l''arr??t (Fuite de courant)', 'V??rification visuelle de nuit', 'V??rifier que rien ne reste allum?? dans l''habitacle une fois les portes verrouill??es.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 22
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 23, new_id, 'Water Pump Inspection & Circulation Verification', 'Inspection and repair guide for Engine Water Pump', 'intermediate', '20 min', 120, 280, 'Always check water pump whenever replacing timing belt to avoid duplicate labor costs.', '["Flashlight","Inspection mirror","Gloves"]', '[{"step":1,"title":"Observe Overflow Return Stream","description":"Remove expansion tank cap cold, start engine, have helper rev to 2500 RPM. A steady continuous stream should shoot into the tank neck.","time_est":"20 min","caution":null},{"step":2,"title":"Check Pulley Bearing Free Play","description":"With engine off, grab water pump pulley firmly with both hands and wiggle up/down. Any audible click or play means bearings are finished.","time_est":"20 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 26
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 23, new_id, 'Test de confirmation : Sonde lambda ou d??bitm??tre d''air d??cal??', 'Observation olfactive', 'Observer si la sortie du pot est tr??s noire de suie et si une odeur d''essence se d??gage ?? l''arr??t.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 26
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 24, new_id, 'Fuel Regulator Vacuum Check & Pressure Gauge Test', 'Inspection and repair guide for Fuel Pressure Regulator', 'easy', '15 min', 65, 190, 'Cover fuel rail test port with shop rag when screwing on gauge to catch escaping fuel spray.', '["Pliers","Shop rag","Fuel pressure gauge kit"]', '[{"step":1,"title":"Sniff Vacuum Line","description":"Pull small vacuum tube off regulator; any gasoline wetness proves immediate internal diaphragm failure.","time_est":"15 min","caution":null},{"step":2,"title":"Observe Pressure Drop After Engine Shut-off","description":"Turn engine off. Pressure should stay above 2.0 bar for at least 15 minutes. Rapid drop indicates leaking regulator or check valve.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 28
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 24, new_id, 'Test de confirmation : Fuel Pressure Regulator', 'Visual ?? Easy', 'Pull vacuum hose off fuel pressure regulator; if raw gasoline drips out, internal diaphragm is torn.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 28
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 25, new_id, 'In-Tank Fuel Pump Priming & Sound Verification', 'Inspection and repair guide for Electric Fuel Pump', 'intermediate', '15 min', 160, 450, 'Do not smoke or use open flames around fuel tank access port.', '["Helper or smartphone video recording"]', '[{"step":1,"title":"Prime Sound Test","description":"Remove fuel filler cap. Have helper turn ignition ON (do not crank). Place ear near filler neck. You should hear a distinct 2-second electric hum.","time_est":"15 min","caution":null},{"step":2,"title":"Check Pump Relay","description":"If completely silent, locate FUEL PUMP relay in fuse panel, verify relay click, and check 15A/20A fuse.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 29
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 25, new_id, 'Test de confirmation : Electric Fuel Pump', 'Multimeter / Test ?? Moderate', 'Listen for 2-second hum from under rear seat when turning ignition to ON (pos II), and test fuel pressure.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 29
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 26, new_id, 'Gas Cap Seal & Filler Neck Rust Check', 'Inspection and repair guide for Fuel Tank & Filler Neck', 'intermediate', '15 min', 110, 420, 'Keep car parked away from ignition sources while inspecting fuel components.', '["Flashlight","Clean rag"]', '[{"step":1,"title":"Examine Gas Cap Rubber Gasket","description":"Remove cap and look at black rubber gasket ring. If split, flattened or cracked, vapor will escape.","time_est":"15 min","caution":null},{"step":2,"title":"Inspect Filler Pipe Behind Wheel","description":"Look inside rear right/left wheel well where tires throw road grit directly against metal fuel pipe.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 30
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 26, new_id, 'Test de confirmation : Fuel Tank & Filler Neck', 'Visual ?? Easy', 'Inspect plastic/metal fuel tank, filler pipe neck for rust holes, and check gas cap rubber seal gasket.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 30
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 27, new_id, 'Inline Fuel Filter Replacement', 'Inspection and repair guide for Fuel Filter', 'easy', '30 min', 30, 95, 'Wear eye protection. Residual fuel pressure will spray when lines are released.', '["Fuel line disconnect tool","Catch basin","Safety glasses"]', '[{"step":1,"title":"Depressurize Fuel System","description":"Pull fuel pump fuse, crank engine until it stalls to deplete line pressure.","time_est":"30 min","caution":null},{"step":2,"title":"Release Quick Fittings","description":"Squeeze plastic tabs or insert release tool into collar, catch draining fuel in pan.","time_est":"30 min","caution":null},{"step":3,"title":"Install New Filter with Correct Flow Direction","description":"Orient arrow pointing toward front of car, push connectors until positive click is heard.","time_est":"30 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 31
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 27, new_id, 'Test de confirmation : Fuel Filter', 'Visual ?? Easy', 'Check maintenance history (replace every 40,000 to 60,000 km) and test fuel flow resistance.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 31
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 28, new_id, 'Timing Belt Visual Inspection & Tension Check', 'Inspection and repair guide for Timing Belt & Synchronization', 'hard', '20 min', 350, 850, 'NEVER turn the engine over using the camshaft bolt; only rotate the crankshaft bolt clockwise.', '["10mm socket","Flashlight","Inspection mirror"]', '[{"step":1,"title":"Unclip Upper Timing Cover","description":"Remove the 2 or 3 bolts on upper plastic timing shroud and pull outward to expose belt.","time_est":"20 min","caution":null},{"step":2,"title":"Check Belt Deflection","description":"Twist belt with thumb and forefinger between sprockets; it should not twist beyond 90 degrees under moderate pressure.","time_est":"20 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 32
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 28, new_id, 'Test de confirmation : Timing Belt & Synchronization', 'Visual ?? Easy', 'Pull back top plastic timing cover inspection window to inspect belt teeth, tension, and fraying.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 32
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 29, new_id, 'Boost Hose Smoke Test & Turbo Shaft Inspection', 'Inspection and repair guide for Turbocharger & Boost Pressure', 'hard', '35 min', 350, 1200, 'Do not touch turbocharger turbine housing immediately after driving; temperatures exceed 600??C.', '["Flat screwdriver","Flashlight","Mirror"]', '[{"step":1,"title":"Feel Along Boost Hoses","description":"Examine thick rubber boost pipes between turbo, intercooler, and intake manifold. Feel for splits on undersides.","time_est":"35 min","caution":null},{"step":2,"title":"Wiggle Compressor Shaft","description":"Remove air intake hose to expose turbo compressor wheel. Gently wiggle shaft; slight radial play (oil cushion) is normal, zero axial play allowed.","time_est":"35 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 34
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 29, new_id, 'Test de confirmation : Turbocharger & Boost Pressure', 'Multimeter / Test ?? Moderate', 'Inspect intercooler rubber boost hoses for splits and check wastegate actuator vacuum movement.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 34
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 30, new_id, 'Engine Mount Rocking & Power Braking Test', 'Inspection and repair guide for Engine & Transmission Mounts', 'intermediate', '15 min', 90, 280, 'Never place jack directly against bare aluminum oil pan without thick wooden block to distribute load.', '["Floor jack with wooden block","Helper"]', '[{"step":1,"title":"Visual Rocking Inspection","description":"Have a helper sit in car with parking brake ON. Put in 1st gear (or Drive), tap accelerator briefly while watching engine. More than 2-3 cm rock indicates bad mount.","time_est":"15 min","caution":null},{"step":2,"title":"Pry Bar Test","description":"Gently lever between mount bracket and chassis rail with pry bar. Free sloppy movement indicates severed rubber core.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 36
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 30, new_id, 'Test de confirmation : Engine & Transmission Mounts', 'Visual ?? Easy', 'Inspect hydraulic / rubber mounts for tears, hydraulic oil leaks, or excessive engine rock when revving.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 36
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 31, new_id, 'Valve Cover Gasket Replacement & Surface Prep', 'Inspection and repair guide for Valve Cover Gasket', 'easy', '1 hour', 55, 180, 'Clean cylinder head mating surface thoroughly. Do not drop dirt or old gasket flakes into exposed camshafts.', '["10mm socket","Brake cleaner","RTV silicone gasket maker","Torque wrench"]', '[{"step":1,"title":"Disconnect Breather Hoses & Coils","description":"Unclip spark plug coils, unbolt ground straps, and pull PCV breather hoses off cover.","time_est":"1 hour","caution":null},{"step":2,"title":"Lift Cover & Scrape Clean","description":"Remove perimeter bolts, lift cover. Clean mating surfaces with brake cleaner.","time_est":"1 hour","caution":null},{"step":3,"title":"Apply RTV at Timing Corners","description":"Place a dab of RTV silicone sealant at the camshaft arch joints, install new gasket, and torque to 9 Nm.","time_est":"1 hour","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 37
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 31, new_id, 'Test de confirmation : Valve Cover Gasket', 'Visual ?? Easy', 'Inspect seam between cylinder head and valve cover for wet oil seepage dripping onto hot exhaust manifold.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 37
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 32, new_id, 'Mechanical Oil Pressure Gauge Hookup & Test', 'Inspection and repair guide for Engine Oil Pump & Pressure', 'hard', '30 min', 350, 950, 'Ensure engine is switched off when removing pressure switch to prevent hot oil ejection.', '["Oil pressure test kit","Thread adapter","Catch pan"]', '[{"step":1,"title":"Remove Oil Pressure Switch","description":"Locate 1-pin sensor near oil filter housing, disconnect plug, unscrew sensor with deep socket.","time_est":"30 min","caution":null},{"step":2,"title":"Thread Gauge Adapter","description":"Screw gauge hose into port, start engine, observe needle. If needle stays near 0, shut engine down in under 5 seconds.","time_est":"30 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 38
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 32, new_id, 'Test de confirmation : Engine Oil Pump & Pressure', 'Multimeter / Test ?? Moderate', 'Screw mechanical oil pressure gauge into pressure switch port to measure actual bar/PSI at idle and 3000 RPM.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 38
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 33, new_id, 'Oil Cap Blow-By "Tea Cup" Test & Compression Check', 'Inspection and repair guide for Piston Rings & Compression', 'hard', '30 min', 650, 1800, 'Disable ignition and fuel injection before cranking engine during compression testing.', '["Compression tester kit","Spark plug socket","Engine oil squirt can"]', '[{"step":1,"title":"Oil Filler Cap Floating Test","description":"Loosen oil cap while engine idles. It should rattle slightly in place; if it shoots off or vents heavy smoke, piston rings are worn.","time_est":"30 min","caution":null},{"step":2,"title":"Execute Dry vs Wet Test","description":"Record dry readings. Squirt 5ml oil into low cylinder; if reading climbs significantly, piston rings/bores are compromised.","time_est":"30 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 39
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 33, new_id, 'Test de confirmation : Piston Rings & Compression', 'Multimeter / Test ?? Moderate', 'Perform dry and wet cylinder compression test across all cylinders (spec: 11-14 bar for petrol, 25-30 bar for diesel).', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 39
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 34, new_id, 'Infrared Temperature Efficiency Test', 'Inspection and repair guide for Catalytic Converter', 'hard', '15 min', 350, 950, 'Exhaust pipes exceed 400??C. Do not touch bare metal.', '["Infrared laser thermometer"]', '[{"step":1,"title":"Warm Engine Thoroughly","description":"Drive vehicle for 10 minutes to reach full operating temperature.","time_est":"15 min","caution":null},{"step":2,"title":"Aim Laser at Inlet and Outlet","description":"Measure exhaust pipe right before converter inlet, then right after outlet flange. Outlet MUST be 30??C to 60??C hotter if catalyst is actively burning hydrocarbons.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 40
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 34, new_id, 'Test de confirmation : Catalytic Converter', 'Visual ?? Easy', 'Measure inlet and outlet temperature using an infrared thermometer (outlet should be 20??C - 50??C hotter than inlet when functioning).', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 40
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 35, new_id, 'Oxygen Sensor Replacement & Thread Antisieze', 'Inspection and repair guide for Oxygen Sensor (Lambda Sonde)', 'intermediate', '35 min', 75, 220, 'Apply penetrating oil while exhaust is warm (not boiling hot) to break factory thread rust.', '["Special slotted 22mm O2 sensor socket","Penetrating oil","High-temp nickel anti-seize"]', '[{"step":1,"title":"Unplug Sensor Connector","description":"Depress locking clip, disconnect harness before unscrewing so wires do not twist.","time_est":"35 min","caution":null},{"step":2,"title":"Unscrew with Slotted 22mm Socket","description":"Fit slotted socket over sensor hex, attach breaker bar, and break free.","time_est":"35 min","caution":null},{"step":3,"title":"Coat Threads & Torque","description":"Ensure new sensor threads have high-temp anti-seize (keep paste off sensor tip!) and torque to 45 Nm.","time_est":"35 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 41
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 35, new_id, 'Test de confirmation : Oxygen Sensor (Lambda Sonde)', 'Multimeter / Test ?? Moderate', 'Read live O2 sensor voltage (0.1V to 0.9V switching response) and check internal heater circuit resistance.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 41
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 36, new_id, 'EVAP Purge Valve Blow Test & Rapid Replacement', 'Inspection and repair guide for EVAP Canister Purge Valve', 'easy', '15 min', 35, 120, 'Disconnect electrical connector before removing vacuum hoses.', '["Pliers","Flashlight"]', '[{"step":1,"title":"Locate Valve on Intake Plenum","description":"Small black plastic cylinder with 2-pin electrical connector and 2 rubber vacuum lines.","time_est":"15 min","caution":null},{"step":2,"title":"Unclip and Blow Through","description":"Try blowing air through either port. If air passes through easily while disconnected from car, valve is stuck open and defective.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 42
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 36, new_id, 'Test de confirmation : EVAP Canister Purge Valve', 'Visual ?? Easy', 'Unplug vacuum hose and blow through valve; with no 12V power applied, valve must be closed and airtight.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 42
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 37, new_id, 'Cold-Start Exhaust Leak Smoke / Bubble Tracing', 'Inspection and repair guide for Exhaust Manifold & Gasket', 'intermediate', '20 min', 110, 380, 'Only spray soapy water when engine is COMPLETELY COLD. Do not spray on hot exhaust manifolds.', '["Soapy water spray bottle (engine cold)","Flashlight","Mirror"]', '[{"step":1,"title":"Cold Engine Spray","description":"Spray soapy water along manifold gasket seam before starting engine.","time_est":"20 min","caution":null},{"step":2,"title":"Start Engine & Watch for Bubbles","description":"Start cold engine. Escaping exhaust gas will instantly blow large soap foam bubbles at the leak site within 10 seconds.","time_est":"20 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 43
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 37, new_id, 'Test de confirmation : Exhaust Manifold & Gasket', 'Visual ?? Easy', 'Inspect cylinder head exhaust flange with mirror for black soot streaks and check for broken manifold studs.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 43
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 38, new_id, 'MAP Sensor Cleaning & O-Ring Service', 'Inspection and repair guide for Manifold Absolute Pressure (M.A.P.) Sensor', 'easy', '15 min', 45, 140, 'Do not insert screwdrivers or sharp objects into sensor port hole; diaphragm will rupture.', '["T20 Torx / 7mm socket","Mass air flow / electronic cleaner"]', '[{"step":1,"title":"Remove Single Screw","description":"Unplug 3-pin connector, remove single retaining screw on intake manifold.","time_est":"15 min","caution":null},{"step":2,"title":"Spray Sensor Port","description":"Spray electrical cleaner into hole to dissolve oil blow-by gunk. Allow to dry 5 minutes before reinstalling.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 44
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 38, new_id, 'Test de confirmation : Manifold Absolute Pressure (M.A.P.) Sensor', 'Multimeter / Test ?? Moderate', 'Read live MAP voltage with ignition ON engine OFF (should read ~4.8V / 100 kPa ambient) and check vacuum hose.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 44
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 39, new_id, 'Door Card Removal & Window Regulator Replacement', 'Inspection and repair guide for Power Window Motor & Regulator', 'intermediate', '1 hour', 80, 240, 'Tape window glass securely to top door frame with masking tape before unbolting regulator.', '["Torx T20/T25 screwdrivers","Plastic trim pry tools","Painter tape","10mm socket"]', '[{"step":1,"title":"Secure Window Glass","description":"Pull glass up by hand and tape securely across door frame with heavy painter tape.","time_est":"1 hour","caution":null},{"step":2,"title":"Remove Door Panel Card","description":"Remove hidden screws behind armrest and door pull, pop perimeter plastic clips with trim tool, unhook cable.","time_est":"1 hour","caution":null},{"step":3,"title":"Unbolt Regulator & Swap","description":"Unbolt glass clamps, unbolt motor and regulator rails, slide out through door access opening and replace.","time_est":"1 hour","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 49
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 39, new_id, 'Test de confirmation : Power Window Motor & Regulator', 'Visual ?? Easy', 'Listen at door panel while pressing switch for motor hum, and test power at motor connector.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 49
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 40, new_id, 'Headlight Bulb Replacement Without Touching Glass', 'Inspection and repair guide for Headlamp Bulb & Socket', 'easy', '15 min', 12, 65, 'Always handle bulbs by their metal base only. If glass is touched, wipe clean with isopropyl alcohol.', '["Clean gloves / paper towel","New H7 or H4 bulb"]', '[{"step":1,"title":"Remove Waterproof Dust Cap","description":"Behind headlamp assembly, twist or peel back round rubber dust cover.","time_est":"15 min","caution":null},{"step":2,"title":"Unclip Spring Retainer","description":"Press wire spring clip inward and toward side to unhook from stamped metal notch.","time_est":"15 min","caution":null},{"step":3,"title":"Align Index Tab","description":"Insert new bulb aligning alignment tab into notch, re-hook wire spring, re-seat rubber cap tightly.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 50
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 40, new_id, 'Test de confirmation : Headlamp Bulb & Socket', 'Visual ?? Easy', 'Inspect bulb halogen filament for breakage and check plastic socket connector for heat melting.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 50
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 41, new_id, 'Wiper Linkage Emergency Reattachment & Motor Swap', 'Inspection and repair guide for Windshield Wiper Motor & Linkage', 'intermediate', '45 min', 75, 240, 'Mark wiper blade resting positions on glass with masking tape before unbolting wiper arms.', '["Wiper arm puller / 13mm wrench","Flat screwdriver","Grease"]', '[{"step":1,"title":"Mark Blade Alignment","description":"Place strip of tape along blade edge on windshield to reinstall at identical angle.","time_est":"45 min","caution":null},{"step":2,"title":"Remove Wiper Arms & Cowl","description":"Pry off nut caps, remove 13mm nuts, use small puller to pop arm off tapered splined shaft, remove plastic cowl clips.","time_est":"45 min","caution":null},{"step":3,"title":"Replace Linkage Assembly","description":"Unbolt 3 motor/linkage bolts, disconnect harness, fit new assembly, and park motor before tightening arms.","time_est":"45 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 51
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 41, new_id, 'Test de confirmation : Windshield Wiper Motor & Linkage', 'Visual ?? Easy', 'Check wiper fuse, listen for motor hum under cowl, and check if linkage ball joints have popped off.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 51
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 42, new_id, 'Clutch Hydraulic Bleeding & Cylinder Inspection', 'Inspection and repair guide for Clutch Master & Slave Cylinder', 'intermediate', '30 min', 110, 320, 'Clutch systems share fluid with brake reservoir on many cars; never let fluid drop below feed nipple.', '["8mm or 10mm flare wrench","Clear bleed hose","Catch bottle","DOT 4 brake fluid"]', '[{"step":1,"title":"Fill Reservoir to Maximum","description":"Keep fluid filled to brim while bleeding to avoid drawing air into clutch pickup port.","time_est":"30 min","caution":null},{"step":2,"title":"Pump and Hold","description":"Have helper pump pedal 5 times, hold to floor. Open slave cylinder bleed screw 1 turn, let air and fluid rush out, close screw.","time_est":"30 min","caution":null},{"step":3,"title":"Repeat Until Solid Resistance","description":"Repeat 4 to 5 cycles until no air bubbles appear and pedal returns with firm snap.","time_est":"30 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 52
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 42, new_id, 'Test de confirmation : Clutch Master & Slave Cylinder', 'Visual ?? Easy', 'Check brake/clutch shared fluid reservoir level and inspect carpet above clutch pedal for damp oily residue.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 52
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 43, new_id, 'Automatic Transmission Fluid Level Check & Pan Service', 'Inspection and repair guide for Automatic Transmission (Fluid & Filter)', 'intermediate', '45 min', 150, 380, 'Vehicle must be level on lift/jack stands and transmission fluid temperature strictly between 35??C and 45??C when checking overflow plug.', '["White lint-free cloth","Fluid transfer pump","OBD scanner to monitor ATF temp"]', '[{"step":1,"title":"Warm Up Transmission","description":"Drive vehicle or idle until ATF temperature reads 40??C on diagnostic tool.","time_est":"45 min","caution":null},{"step":2,"title":"Shift Through All Gears","description":"Foot on brake, shift P -> R -> N -> D -> 1 holding 3 seconds in each position, return to Park.","time_est":"45 min","caution":null},{"step":3,"title":"Verify Steady Stream","description":"Remove overflow level plug with engine idling. Fluid should drip out as a thin pencil stream. If nothing drips, add fluid.","time_est":"45 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 53
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 43, new_id, 'Test de confirmation : Automatic Transmission (Fluid & Filter)', 'Visual ?? Easy', 'Check ATF fluid level and color on dipstick (or overflow plug at 40??C): should be clear red, not black or smelling burned.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 53
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 44, new_id, 'U-Joint Play Inspection & CV Boot Check', 'Inspection and repair guide for Driveshaft, CV Axle & Universal Joint', 'intermediate', '20 min', 120, 380, 'Transmission must be in Neutral to relieve drivetrain binding before checking driveshaft rotation by hand.', '["Pry bar","Flashlight","Gloves"]', '[{"step":1,"title":"Chock Wheels and Set Neutral","description":"Safely block tires with chocks, shift transmission into Neutral so driveshaft can turn freely.","time_est":"20 min","caution":null},{"step":2,"title":"Twist Cross Joint","description":"Firmly grasp each side of the universal joint and twist in opposite directions. Any visual movement between cross and yoke means bearing failure.","time_est":"20 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 54
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 44, new_id, 'Test de confirmation : Driveshaft, CV Axle & Universal Joint', 'Visual ?? Easy', 'Grab driveshaft / CV axle by hand and twist firmly to check for rotational free play in U-joint caps or torn rubber boots.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 54
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 45, new_id, 'Differential Fluid Inspection & Pinion Seal Check', 'Inspection and repair guide for Differential & Bevel Gears', 'hard', '25 min', 250, 750, 'Differential fluid has a strong sulfur odor; wear nitrile gloves.', '["3/8\\" ratchet or 24mm wrench","Catch pan","Gear oil pump"]', '[{"step":1,"title":"ALWAYS Remove FILL Plug First","description":"Never drain differential until you confirm the upper fill plug unscrews cleanly.","time_est":"25 min","caution":null},{"step":2,"title":"Inspect Magnet Plug","description":"Wipe drain plug magnet. Fine gray paste is normal wear; large metal flakes or gear tooth chips indicate mechanical failure.","time_est":"25 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 55
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 45, new_id, 'Test de confirmation : Differential & Bevel Gears', 'Visual ?? Easy', 'Check differential gear oil level and inspect magnetic drain plug for metal shards or low fluid.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 55
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 46, new_id, 'Power Steering Air Bleeding & Level Adjustment', 'Inspection and repair guide for Power Steering Pump & Fluid', 'intermediate', '15 min', 80, 340, 'Do not hold steering wheel at full lock against stops for more than 5 seconds; this overheats pump relief valve.', '["Clean lint-free rag","Power steering fluid bottle"]', '[{"step":1,"title":"Raise Front Wheels Off Ground","description":"Lift front axle on jack stands so tires turn freely without ground friction.","time_est":"15 min","caution":null},{"step":2,"title":"Lock-to-Lock Bleed Engine Off","description":"With engine OFF and reservoir cap open, turn wheel slowly lock-to-lock 15 times to purge trapped air bubbles into reservoir.","time_est":"15 min","caution":null},{"step":3,"title":"Top Up Fluid Level","description":"Verify fluid is bubble-free, top up to FULL mark, start engine and verify silence.","time_est":"15 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 56
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 46, new_id, 'Test de confirmation : Power Steering Pump & Fluid', 'Visual ?? Easy', 'Check power steering reservoir fluid dipstick level and check for bubbles / foaming while engine runs.', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 56
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO solutions (id, fault_id, title, subtitle, difficulty, est_time, est_cost_min, est_cost_max, safety_warning, tools_needed, steps, garage_memo_tip)
SELECT 47, new_id, 'Tire Pressure Reset & Door Placard Verification', 'Inspection and repair guide for Tire Pressure Monitoring System (TPMS)', 'easy', '10 min', 35, 95, 'Always check pressures when tires have been parked for at least 3 hours; driving heats air and raises pressure artificially.', '["Digital tire pressure gauge","Tire inflator compressor"]', '[{"step":1,"title":"Read Driver Door Pillar Sticker","description":"Open driver door, look at white/yellow placard for exact FRONT and REAR pressure specs in bar or PSI.","time_est":"10 min","caution":null},{"step":2,"title":"Adjust All 4 Tires","description":"Inflate or deflate each tire precisely to placard spec.","time_est":"10 min","caution":null},{"step":3,"title":"Initiate TPMS Reset","description":"In vehicle infotainment or dashboard menu, select \\"Vehicle Settings\\" -> \\"Tyre Pressure\\" -> \\"SET\\" and drive for 10 minutes to learn.","time_est":"10 min","caution":null}]', 'Vérifiez toujours le bon serrage au couple recommandé constructeur.'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 58
ON DUPLICATE KEY UPDATE title = VALUES(title);
INSERT INTO diagnostic_tests (id, fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning, time_est)
SELECT 47, new_id, 'Test de confirmation : Tire Pressure Monitoring System (TPMS)', 'Visual ?? Easy', 'Check cold tire pressure on all 4 tires (and spare) with gauge against door jamb sticker spec (e.g., 2.3 bar / 33 PSI).', 'Aucun jeu excessif, fuite ou valeur hors tolérance électrique.', 'Lampe torche, gants', 'Porter des gants et lunettes de protection.', '15 min'
FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id = 58
ON DUPLICATE KEY UPDATE title = VALUES(title);

COMMIT;
