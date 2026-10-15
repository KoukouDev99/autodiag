const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { initDatabase } = require('./db');

async function mergeAndEnrichDtc() {
  console.log('[OBDEX MERGE] Starting OBDEx deep enrichment & deduplication...');

  const obdexGenericPath = 'C:\\Users\\yakoub\\.gemini\\antigravity-ide\\brain\\6798eff0-b999-4f86-945d-b7ffd0b25fce\\scratch\\obdex\\dist\\generic.json';
  const existingDtcPath = path.join(__dirname, 'dtc_database.json');
  const pidsMode01Path = 'C:\\Users\\yakoub\\.gemini\\antigravity-ide\\brain\\6798eff0-b999-4f86-945d-b7ffd0b25fce\\scratch\\obdex\\dist\\pids\\mode01.json';
  const pidsMode09Path = 'C:\\Users\\yakoub\\.gemini\\antigravity-ide\\brain\\6798eff0-b999-4f86-945d-b7ffd0b25fce\\scratch\\obdex\\dist\\pids\\mode09.json';

  if (!fs.existsSync(obdexGenericPath)) {
    throw new Error('obdex generic.json not found at ' + obdexGenericPath);
  }

  const obdexCodes = JSON.parse(fs.readFileSync(obdexGenericPath, 'utf8'));
  const existingDtc = JSON.parse(fs.readFileSync(existingDtcPath, 'utf8'));
  const mode01Pids = fs.existsSync(pidsMode01Path) ? JSON.parse(fs.readFileSync(pidsMode01Path, 'utf8')) : [];
  const mode09Pids = fs.existsSync(pidsMode09Path) ? JSON.parse(fs.readFileSync(pidsMode09Path, 'utf8')) : [];

  console.log(`[OBDEX MERGE] Existing DTC count: ${existingDtc.length}`);
  console.log(`[OBDEX MERGE] OBDEx Generic count: ${obdexCodes.length}`);
  console.log(`[OBDEX MERGE] OBD-II PIDs count: ${mode01Pids.length + mode09Pids.length}`);

  // 1. Build map of existing codes
  const codeMap = new Map();
  for (const item of existingDtc) {
    codeMap.set(item.code.toUpperCase(), item);
  }

  let enrichedCount = 0;
  let addedCount = 0;

  // Helper to map category
  function getSystemFromCategory(cat) {
    const c = (cat || '').toLowerCase();
    if (c === 'powertrain') return 'Powertrain (Engine & Transmission)';
    if (c === 'chassis') return 'Chassis (Braking, ABS, Suspension)';
    if (c === 'body') return 'Body (Safety, Airbags, Comfort)';
    if (c === 'network') return 'Network (CAN Bus, ECU Communication)';
    return 'Vehicle System';
  }

  // Helper to map urgency from difficulty & flags
  function determineUrgency(code, obdItem) {
    if (obdItem.flags && obdItem.flags.mil) {
      if (code.startsWith('P03') || obdItem.flags.limp_mode_possible) return 'Urgent / Danger';
      if (obdItem.flags.emissions_relevant) return 'High';
    }
    return 'Moderate';
  }

  for (const obd of obdexCodes) {
    const code = obd.code.trim().toUpperCase();
    const existing = codeMap.get(code);

    // Extract causes labels with likelihood
    const enrichedCauses = Array.isArray(obd.common_causes) 
      ? obd.common_causes.map(c => {
          const lbl = (c.label && c.label.en) ? c.label.en : (typeof c.label === 'string' ? c.label : (c.id || 'Component wear'));
          const likelihood = c.likelihood ? ` [${c.likelihood.toUpperCase()}]` : '';
          return `${lbl}${likelihood}`;
        })
      : [];

    // Extract symptoms
    const enrichedSymptoms = Array.isArray(obd.symptoms)
      ? obd.symptoms.map(s => (s.en ? s.en : (typeof s === 'string' ? s : '')))
      : [];

    const costMin = (obd.repair && Array.isArray(obd.repair.estimated_cost_eur)) ? obd.repair.estimated_cost_eur[0] : null;
    const costMax = (obd.repair && Array.isArray(obd.repair.estimated_cost_eur)) ? obd.repair.estimated_cost_eur[1] : null;
    const hoursMin = (obd.repair && Array.isArray(obd.repair.estimated_hours)) ? obd.repair.estimated_hours[0] : null;
    const hoursMax = (obd.repair && Array.isArray(obd.repair.estimated_hours)) ? obd.repair.estimated_hours[1] : null;

    if (existing) {
      // Enrich existing code without losing manufacturer definitions!
      existing.bilingual_title = obd.title || null;
      if (obd.description && obd.description.en) {
        existing.description = obd.description.en;
        existing.bilingual_description = obd.description;
      }
      existing.affected_components = obd.affected_components || [];
      if (enrichedCauses.length > 0) existing.possible_causes = enrichedCauses;
      if (enrichedSymptoms.length > 0) existing.symptoms = enrichedSymptoms;
      
      existing.repair_info = {
        difficulty: obd.repair ? obd.repair.difficulty : 'medium',
        diy_possible: obd.repair ? obd.repair.diy_possible : false,
        cost_min_eur: costMin,
        cost_max_eur: costMax,
        hours_min: hoursMin,
        hours_max: hoursMax
      };

      existing.flags = obd.flags || { mil: true, emissions_relevant: true };
      existing.related_codes = obd.related_codes || [];
      existing.sources = obd.sources || [];
      existing.urgency = determineUrgency(code, obd);

      if (costMin !== null && costMax !== null) {
        existing.garage_advice = `Estimated repair: ${costMin}€ - ${costMax}€ (${hoursMin || 1}h - ${hoursMax || 2}h labor). ${obd.repair.diy_possible ? 'DIY feasible with standard tools.' : 'Professional workshop recommended.'}`;
      }

      enrichedCount++;
    } else {
      // New generic code from OBDEx
      const dtcType = code[0];
      const newRec = {
        code,
        type: dtcType,
        system: getSystemFromCategory(obd.category),
        subsystem: obd.category || 'General',
        is_generic: true,
        title: (obd.title && obd.title.en) ? obd.title.en : code,
        bilingual_title: obd.title || null,
        description: (obd.description && obd.description.en) ? obd.description.en : '',
        bilingual_description: obd.description || null,
        manufacturers: ['GENERIC'],
        specific_definitions: {},
        affected_components: obd.affected_components || [],
        possible_causes: enrichedCauses.length > 0 ? enrichedCauses : ['Component malfunction in ' + obd.category],
        symptoms: enrichedSymptoms,
        urgency: determineUrgency(code, obd),
        repair_info: {
          difficulty: obd.repair ? obd.repair.difficulty : 'medium',
          diy_possible: obd.repair ? obd.repair.diy_possible : false,
          cost_min_eur: costMin,
          cost_max_eur: costMax,
          hours_min: hoursMin,
          hours_max: hoursMax
        },
        flags: obd.flags || {},
        related_codes: obd.related_codes || [],
        sources: obd.sources || [],
        garage_advice: costMin !== null ? `Estimated repair: ${costMin}€ - ${costMax}€.` : 'Inspect circuit with scan tool.'
      };

      codeMap.set(code, newRec);
      addedCount++;
    }
  }

  const mergedDtcList = Array.from(codeMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  console.log(`[OBDEX MERGE] Enriched ${enrichedCount} existing codes.`);
  console.log(`[OBDEX MERGE] Added ${addedCount} new generic codes.`);
  console.log(`[OBDEX MERGE] Final merged unique DTC count: ${mergedDtcList.length} (ZERO DUPLICATES).`);

  // Write enriched JSON
  fs.writeFileSync(existingDtcPath, JSON.stringify(mergedDtcList, null, 2), 'utf8');
  console.log(`[OBDEX MERGE] Saved enriched master dataset to ${existingDtcPath}`);

  // Write PIDs JSON
  const allPids = [
    ...mode01Pids.map(p => ({ ...p, mode_name: 'Mode 01 - Live Sensor Diagnostics' })),
    ...mode09Pids.map(p => ({ ...p, mode_name: 'Mode 09 - Vehicle Information & Calibration' }))
  ];
  const pidsOutPath = path.join(__dirname, 'obd_pids.json');
  fs.writeFileSync(pidsOutPath, JSON.stringify(allPids, null, 2), 'utf8');
  console.log(`[OBDEX MERGE] Saved ${allPids.length} OBD-II PIDs to ${pidsOutPath}`);

  // 2. Connect to MySQL and update dtc_codes + create obd_pids table
  const pool = await initDatabase();

  // Add rich columns if not already present
  const columnsToAdd = [
    { name: 'bilingual_title', sql: 'ALTER TABLE dtc_codes ADD COLUMN bilingual_title JSON' },
    { name: 'affected_components', sql: 'ALTER TABLE dtc_codes ADD COLUMN affected_components JSON' },
    { name: 'symptoms', sql: 'ALTER TABLE dtc_codes ADD COLUMN symptoms JSON' },
    { name: 'repair_info', sql: 'ALTER TABLE dtc_codes ADD COLUMN repair_info JSON' },
    { name: 'flags', sql: 'ALTER TABLE dtc_codes ADD COLUMN flags JSON' },
    { name: 'related_codes', sql: 'ALTER TABLE dtc_codes ADD COLUMN related_codes JSON' }
  ];

  for (const col of columnsToAdd) {
    try {
      await pool.query(col.sql);
    } catch (_) {}
  }

  // Create obd_pids table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS obd_pids (
      id INT AUTO_INCREMENT PRIMARY KEY,
      pid VARCHAR(10) NOT NULL,
      mode VARCHAR(10) NOT NULL,
      bytes INT NOT NULL DEFAULT 1,
      formula VARCHAR(100),
      unit VARCHAR(50),
      name_en VARCHAR(200) NOT NULL,
      name_de VARCHAR(200),
      range_min DECIMAL(10,2),
      range_max DECIMAL(10,2),
      sources JSON,
      INDEX idx_pid (pid),
      INDEX idx_mode (mode)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log('[OBDEX MERGE] Seeding enriched DTC data into MySQL...');

  // Update/insert into MySQL in chunks of 500
  const BATCH_SIZE = 500;
  let saved = 0;

  for (let i = 0; i < mergedDtcList.length; i += BATCH_SIZE) {
    const chunk = mergedDtcList.slice(i, i + BATCH_SIZE);
    const placeholders = [];
    const values = [];

    for (const item of chunk) {
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      values.push(
        item.code,
        item.type || item.code[0],
        item.system,
        item.subsystem || '',
        item.is_generic ? 1 : 0,
        item.title ? item.title.slice(0, 255) : item.code,
        item.description || '',
        JSON.stringify(item.manufacturers || []),
        JSON.stringify(item.specific_definitions || {}),
        JSON.stringify(item.possible_causes || []),
        item.urgency || 'Moderate',
        item.garage_advice || '',
        JSON.stringify(item.bilingual_title || {}),
        JSON.stringify(item.affected_components || []),
        JSON.stringify(item.symptoms || []),
        JSON.stringify(item.repair_info || {}),
        JSON.stringify(item.flags || {}),
        JSON.stringify(item.related_codes || [])
      );
    }

    const query = `
      INSERT INTO dtc_codes (
        code, type, system, subsystem, is_generic, title, description,
        manufacturers, specific_definitions, possible_causes, urgency, garage_advice,
        bilingual_title, affected_components, symptoms, repair_info, flags, related_codes
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
        garage_advice = VALUES(garage_advice),
        bilingual_title = VALUES(bilingual_title),
        affected_components = VALUES(affected_components),
        symptoms = VALUES(symptoms),
        repair_info = VALUES(repair_info),
        flags = VALUES(flags),
        related_codes = VALUES(related_codes);
    `;

    await pool.query(query, values);
    saved += chunk.length;
    process.stdout.write(`\r[OBDEX MERGE] Synchronized ${saved} / ${mergedDtcList.length} codes into MySQL...`);
  }

  // Seed PIDs
  await pool.query('TRUNCATE TABLE obd_pids');
  for (const pidItem of allPids) {
    const rangeMin = (pidItem.range && Array.isArray(pidItem.range)) ? pidItem.range[0] : null;
    const rangeMax = (pidItem.range && Array.isArray(pidItem.range)) ? pidItem.range[1] : null;
    await pool.query(
      `INSERT INTO obd_pids (pid, mode, bytes, formula, unit, name_en, name_de, range_min, range_max, sources)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pidItem.pid,
        pidItem.mode,
        pidItem.bytes || 1,
        pidItem.formula || '',
        pidItem.unit || '',
        (pidItem.name && pidItem.name.en) ? pidItem.name.en : (typeof pidItem.name === 'string' ? pidItem.name : ''),
        (pidItem.name && pidItem.name.de) ? pidItem.name.de : '',
        rangeMin,
        rangeMax,
        JSON.stringify(pidItem.sources || [])
      ]
    );
  }

  console.log(`\n[OBDEX MERGE] Seeded ${allPids.length} OBD-II PIDs into MySQL obd_pids table.`);
  console.log('[OBDEX MERGE] Integration complete successfully!');
  process.exit(0);
}

mergeAndEnrichDtc().catch(err => {
  console.error('\n[OBDEX MERGE ERROR]', err);
  process.exit(1);
});
