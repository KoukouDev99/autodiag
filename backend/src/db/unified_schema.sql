-- ==============================================================================
-- AutoDiag Unified Knowledge Base & Rule-Based Diagnostic Architecture
-- ==============================================================================

-- 1. Data Sources (Origine des données importées pour traçabilité)
CREATE TABLE IF NOT EXISTS data_sources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(80) NOT NULL UNIQUE,
  source_type ENUM('open_source', 'api', 'manual_curation', 'oem', 'crowdsourced') DEFAULT 'manual_curation',
  license VARCHAR(100) DEFAULT 'MIT',
  version VARCHAR(50) DEFAULT '1.0',
  source_url VARCHAR(255),
  description TEXT,
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Source Records (Traçabilité des données brutes avant fusion)
CREATE TABLE IF NOT EXISTS source_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source_id INT NOT NULL,
  external_id VARCHAR(100),
  entity_type VARCHAR(50) NOT NULL, -- 'fault', 'symptom', 'dtc', 'rule', 'solution'
  raw_payload JSON,
  notes TEXT,
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Symptoms Normalization column
ALTER TABLE symptoms ADD COLUMN IF NOT EXISTS normalized_name VARCHAR(150) AFTER label;

-- 4. Faults (Catalogue normalisé des pannes physiques)
CREATE TABLE IF NOT EXISTS faults (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE, -- e.g. 'FAULT-BAT-001', 'FAULT-STA-001'
  name VARCHAR(200) NOT NULL,
  normalized_name VARCHAR(200) NOT NULL,
  system VARCHAR(80) NOT NULL, -- 'Démarrage', 'Allumage', 'Injection', 'Freinage', 'Refroidissement', etc.
  category VARCHAR(80) DEFAULT 'Mécanique',
  description TEXT NOT NULL,
  gravity_label VARCHAR(150),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  cost_min INT DEFAULT 50,
  cost_max INT DEFAULT 200,
  is_danger BOOLEAN DEFAULT FALSE,
  source_record_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_record_id) REFERENCES source_records(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Fault Symptoms (Table de liaison N:M entre symptômes et pannes)
CREATE TABLE IF NOT EXISTS fault_symptoms (
  fault_id INT NOT NULL,
  symptom_id INT NOT NULL,
  relevance_score DECIMAL(5,2) DEFAULT 1.00,
  is_primary BOOLEAN DEFAULT FALSE,
  evidence_level ENUM('unverified', 'reported', 'validated') DEFAULT 'validated',
  PRIMARY KEY (fault_id, symptom_id),
  FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE,
  FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Fault Vehicles (Compatibilité motorisation / carburant / année / kilométrage)
CREATE TABLE IF NOT EXISTS fault_vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fault_id INT NOT NULL,
  make VARCHAR(80) DEFAULT NULL, -- NULL = toutes marques
  model VARCHAR(80) DEFAULT NULL, -- NULL = tous modèles
  fuel_type VARCHAR(50) DEFAULT NULL, -- 'Essence', 'Diesel', 'Hybride', 'Électrique', NULL = tous
  engine_code VARCHAR(100) DEFAULT NULL,
  year_start INT DEFAULT NULL,
  year_end INT DEFAULT NULL,
  mileage_min INT DEFAULT 0,
  compatibility ENUM('compatible', 'frequent', 'incompatible') DEFAULT 'compatible',
  notes TEXT,
  FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Diagnostic Questions (Questions de distinction et parcours)
CREATE TABLE IF NOT EXISTS diagnostic_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symptom_id INT NOT NULL,
  step_num INT NOT NULL DEFAULT 1,
  category VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  warning_text TEXT,
  question_type VARCHAR(30) DEFAULT 'single_choice',
  safety_critical BOOLEAN DEFAULT FALSE,
  why_ask TEXT,
  image_url VARCHAR(255),
  reformulation TEXT,
  test_action TEXT,
  test_type VARCHAR(50) DEFAULT 'observation',
  source_record_id INT DEFAULT NULL,
  FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE,
  FOREIGN KEY (source_record_id) REFERENCES source_records(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8. Answer Options (Options de réponse)
CREATE TABLE IF NOT EXISTS answer_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  label VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  icon VARCHAR(50) DEFAULT 'info',
  is_default BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 1,
  FOREIGN KEY (question_id) REFERENCES diagnostic_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Diagnostic Rules (Cœur du moteur : Effet sur chaque hypothèse)
CREATE TABLE IF NOT EXISTS diagnostic_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  answer_option_id INT NOT NULL,
  fault_id INT NOT NULL,
  effect ENUM('reinforce', 'reduce', 'exclude') NOT NULL DEFAULT 'reinforce',
  weight DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  next_question_id INT DEFAULT NULL,
  source_record_id INT DEFAULT NULL,
  notes TEXT,
  FOREIGN KEY (question_id) REFERENCES diagnostic_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (answer_option_id) REFERENCES answer_options(id) ON DELETE CASCADE,
  FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE,
  FOREIGN KEY (next_question_id) REFERENCES diagnostic_questions(id) ON DELETE SET NULL,
  FOREIGN KEY (source_record_id) REFERENCES source_records(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. Diagnostic Tests (Contrôles sans outillage / sensoriels pour confirmer/écarter)
CREATE TABLE IF NOT EXISTS diagnostic_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fault_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  test_type VARCHAR(50) DEFAULT 'observation', -- 'visual', 'acoustic', 'action', 'multimeter'
  instruction TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  tools_needed VARCHAR(255) DEFAULT 'Aucun outil (observation)',
  safety_warning TEXT,
  time_est VARCHAR(50) DEFAULT '5 min',
  FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Solutions (Guides de réparation pas-à-pas et estimations)
CREATE TABLE IF NOT EXISTS solutions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fault_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  difficulty ENUM('easy', 'intermediate', 'hard', 'pro') DEFAULT 'easy',
  est_time VARCHAR(50) DEFAULT '30 min',
  est_cost_min INT DEFAULT 50,
  est_cost_max INT DEFAULT 200,
  safety_warning TEXT,
  tools_needed JSON,
  steps JSON,
  garage_memo_tip TEXT,
  FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
) ENGINE=InnoDB;
