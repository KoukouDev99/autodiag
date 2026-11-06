-- Migration 010: Safety Rules Table & Seed Data
-- Base: autodiag_dev (Compatible MariaDB 10.4)
-- Date: 2026-10-15

CREATE TABLE IF NOT EXISTS safety_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  symptom_pattern VARCHAR(100) NOT NULL COMMENT 'Regex pattern or keyword',
  fault_code VARCHAR(50) DEFAULT NULL,
  severity VARCHAR(30) NOT NULL DEFAULT 'safety_critical',
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pattern (symptom_pattern)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

START TRANSACTION;

INSERT INTO safety_rules (id, symptom_pattern, fault_code, severity, message)
VALUES
  (1, 'frein|pédale molle|freinage inopérant', 'FAULT-BRK-002', 'safety_critical', 'DANGER CRITIQUE : Défaillance grave du système de freinage. Ne prenez pas la route. Faites remorquer le véhicule immédiatement.'),
  (2, 'direction|volant dur|direction bloquée', 'FAULT-STR-001', 'safety_critical', 'DANGER MAJEUR : Défaillance de la direction assistée. Risque de perte de contrôle du véhicule. Ne conduisez pas.'),
  (3, 'airbag|prétensionneur', NULL, 'safety_critical', 'SÉCURITÉ PASSIVE : Défaut de retenue de sécurité. En cas de choc, les airbags risquent de ne pas se déployer. Contrôle impératif en atelier.'),
  (4, 'fuite carburant|odeur essence|fuite essence|fuite gasoil', 'FAULT-FUE-001', 'safety_critical', 'RISQUE D\'INCENDIE IMMÉDIAT : Présence de vapeur ou fuite active de carburant. Coupez le contact, n\'allumez aucune flamme et aérez la zone.')
ON DUPLICATE KEY UPDATE
  message = VALUES(message),
  severity = VALUES(severity);

COMMIT;
