-- AutoDiag SQL Schema for MySQL
-- Database: dynamic from environment configuration


-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password VARCHAR(255) DEFAULT 'password123',
  phone VARCHAR(30) DEFAULT '06 12 34 56 78',
  city VARCHAR(100) DEFAULT 'Paris',
  avatar_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  year INT NOT NULL,
  fuel VARCHAR(50) NOT NULL,
  engine VARCHAR(100) NOT NULL,
  mileage INT NOT NULL,
  license_plate VARCHAR(20) DEFAULT NULL,
  is_primary BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Symptoms
CREATE TABLE IF NOT EXISTS symptoms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  description TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Legacy Hypotheses (Historique conservé)
CREATE TABLE IF NOT EXISTS legacy_hypotheses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symptom_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  priority_badge VARCHAR(50) NOT NULL,
  priority_label VARCHAR(50) NOT NULL,
  order_index INT NOT NULL DEFAULT 1,
  description TEXT NOT NULL,
  gravity VARCHAR(80) NOT NULL,
  check_action TEXT NOT NULL,
  check_type VARCHAR(80) NOT NULL,
  cost_min INT NOT NULL,
  cost_max INT NOT NULL,
  cost_currency VARCHAR(10) DEFAULT '€',
  is_danger BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Legacy Questions for Diagnostic Trees
CREATE TABLE IF NOT EXISTS legacy_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symptom_id INT NOT NULL,
  step_num INT NOT NULL,
  total_steps INT NOT NULL DEFAULT 5,
  category VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  warning_text TEXT,
  FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Legacy Question Options
CREATE TABLE IF NOT EXISTS legacy_question_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  icon VARCHAR(50) DEFAULT 'info',
  is_default BOOLEAN DEFAULT FALSE,
  hypothesis_weights JSON,
  next_step INT DEFAULT NULL,
  FOREIGN KEY (question_id) REFERENCES legacy_questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Legacy Repair & Inspection Guides
CREATE TABLE IF NOT EXISTS legacy_repair_guides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hypothesis_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  subtitle VARCHAR(200) NOT NULL,
  difficulty VARCHAR(50) NOT NULL DEFAULT 'Facile',
  est_time VARCHAR(50) NOT NULL DEFAULT '5 min environ',
  total_steps INT NOT NULL DEFAULT 3,
  safety_warning TEXT NOT NULL,
  tools_needed JSON,
  FOREIGN KEY (hypothesis_id) REFERENCES legacy_hypotheses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Legacy Repair Steps
CREATE TABLE IF NOT EXISTS legacy_repair_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guide_id INT NOT NULL,
  step_num INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  time_est VARCHAR(50) DEFAULT '2 min',
  description TEXT NOT NULL,
  subtext TEXT,
  caution_warning TEXT,
  image_url VARCHAR(255),
  FOREIGN KEY (guide_id) REFERENCES legacy_repair_guides(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Diagnostic Sessions
CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vehicle_id INT NOT NULL,
  symptom_id INT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'in_progress',
  current_step INT NOT NULL DEFAULT 1,
  summary_title VARCHAR(255),
  summary_desc TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (symptom_id) REFERENCES symptoms(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Session Answers
CREATE TABLE IF NOT EXISTS session_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  question_id INT NOT NULL,
  option_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sa_session FOREIGN KEY (session_id) REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_question FOREIGN KEY (question_id) REFERENCES diagnostic_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_sa_option FOREIGN KEY (option_id) REFERENCES answer_options(id) ON DELETE CASCADE,
  UNIQUE KEY uk_session_question (session_id, question_id)
) ENGINE=InnoDB;

-- 10b. Diagnostic Results (Persistance temps-réel)
CREATE TABLE IF NOT EXISTS diagnostic_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  fault_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  `rank` INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_dr_session (session_id),
  KEY idx_dr_fault (fault_id),
  CONSTRAINT fk_dr_session FOREIGN KEY (session_id) REFERENCES diagnostic_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_dr_fault FOREIGN KEY (fault_id) REFERENCES faults(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. DTC Codes Knowledge
CREATE TABLE IF NOT EXISTS dtc_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  system VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  possible_causes JSON,
  urgency VARCHAR(50) NOT NULL, -- 'Élevée', 'Modérée', 'Faible'
  garage_advice TEXT NOT NULL
) ENGINE=InnoDB;

-- 12. Maintenance Records
CREATE TABLE IF NOT EXISTS maintenance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  service_date DATE NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  mileage INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Car Catalog (Makes, Models, Production Years)
CREATE TABLE IF NOT EXISTS car_catalog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  make_group VARCHAR(80) NOT NULL,
  make VARCHAR(80) NOT NULL,
  model VARCHAR(120) NOT NULL,
  year_start INT DEFAULT NULL,
  year_end INT DEFAULT NULL,
  INDEX idx_make (make),
  INDEX idx_model (model)
) ENGINE=InnoDB;

