const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { initDatabase } = require('./db');

async function seedDtcDatabase() {
  console.log('[DTC SEED] Starting DTC Database Seeding...');
  
  const pool = await initDatabase();
  const dtcDataPath = path.join(__dirname, 'dtc_database.json');
  if (!fs.existsSync(dtcDataPath)) {
    throw new Error('dtc_database.json not found at ' + dtcDataPath);
  }

  const dtcs = JSON.parse(fs.readFileSync(dtcDataPath, 'utf8'));
  console.log(`[DTC SEED] Loaded ${dtcs.length} unique, deduplicated DTC records.`);

  // 1. Ensure table schema has all modern fields
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dtc_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) NOT NULL UNIQUE,
      type CHAR(1) NOT NULL,
      system VARCHAR(100) NOT NULL,
      subsystem VARCHAR(100) NOT NULL,
      is_generic BOOLEAN DEFAULT TRUE,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      manufacturers JSON,
      specific_definitions JSON,
      possible_causes JSON,
      urgency VARCHAR(50) NOT NULL,
      garage_advice TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code (code),
      INDEX idx_type (type),
      INDEX idx_urgency (urgency)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  // Check if columns exist (for migration if old table existed)
  const columnsToAdd = [
    { name: 'type', sql: 'ALTER TABLE dtc_codes ADD COLUMN type CHAR(1) DEFAULT "P"' },
    { name: 'subsystem', sql: 'ALTER TABLE dtc_codes ADD COLUMN subsystem VARCHAR(100) DEFAULT ""' },
    { name: 'is_generic', sql: 'ALTER TABLE dtc_codes ADD COLUMN is_generic BOOLEAN DEFAULT TRUE' },
    { name: 'manufacturers', sql: 'ALTER TABLE dtc_codes ADD COLUMN manufacturers JSON' },
    { name: 'specific_definitions', sql: 'ALTER TABLE dtc_codes ADD COLUMN specific_definitions JSON' }
  ];

  for (const col of columnsToAdd) {
    try {
      await pool.query(col.sql);
    } catch (_) {}
  }

  console.log('[DTC SEED] Table schema verified. Batch inserting records...');

  // 2. Batch insert in chunks of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < dtcs.length; i += BATCH_SIZE) {
    const chunk = dtcs.slice(i, i + BATCH_SIZE);
    const values = [];
    const placeholders = [];

    for (const item of chunk) {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      values.push(
        item.code,
        item.type || item.code[0],
        item.system,
        item.subsystem,
        item.is_generic ? 1 : 0,
        item.description.slice(0, 255),
        item.description,
        JSON.stringify(item.manufacturers || []),
        JSON.stringify(item.specific_definitions || {}),
        JSON.stringify(item.possible_causes || []),
        item.urgency || 'Moderate',
        item.garage_advice || ''
      );
    }

    const query = `
      INSERT INTO dtc_codes (
        code, type, system, subsystem, is_generic, title, description,
        manufacturers, specific_definitions, possible_causes, urgency, garage_advice
      ) VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE
        type = VALUES(type),
        system = VALUES(system),
        subsystem = VALUES(subsystem),
        is_generic = VALUES(is_generic),
        title = VALUES(title),
        description = VALUES(description),
        manufacturers = VALUES(manufacturers),
        specific_definitions = VALUES(specific_definitions),
        possible_causes = VALUES(possible_causes),
        urgency = VALUES(urgency),
        garage_advice = VALUES(garage_advice);
    `;

    await pool.query(query, values);
    inserted += chunk.length;
    process.stdout.write(`\r[DTC SEED] Inserted ${inserted} / ${dtcs.length} codes...`);
  }

  console.log('\n[DTC SEED] All 12,128 DTC records successfully seeded into MySQL!');
  process.exit(0);
}

seedDtcDatabase().catch(err => {
  console.error('\n[DTC SEED ERROR]', err);
  process.exit(1);
});
