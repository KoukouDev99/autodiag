const fs = require('fs');
const path = require('path');
const { initDatabase, getPool } = require('../backend/src/db/db');

async function exportRAGDocuments() {
  await initDatabase();
  const pool = getPool();

  console.log('[RAG Export] Loading data sources...');
  const [sources] = await pool.query('SELECT id, name, code, license, version FROM data_sources');
  const sourceMap = {};
  for (const s of sources) {
    sourceMap[s.id] = s;
    sourceMap[s.code] = s;
  }

  const autodiagSource = sourceMap['SRC-AUTODIAG-HEURISTICS'] || {
    id: 2,
    name: 'AutoDiag Diagnostic Sensory Trees & Workshop Heuristics',
    code: 'SRC-AUTODIAG-HEURISTICS',
    license: 'CC-BY-NC-SA 4.0',
    version: '4.2'
  };

  const saeSource = sourceMap['SRC-SAE-J2012'] || {
    id: 1,
    name: 'SAE J2012 / ISO 15031-6 Standard OBD-II Database',
    code: 'SRC-SAE-J2012',
    license: 'MIT',
    version: '2024.1'
  };

  const documents = [];

  // 1. Faults
  console.log('[RAG Export] Exporting unified faults...');
  const [faults] = await pool.query('SELECT * FROM faults ORDER BY id ASC');
  for (const f of faults) {
    const text = `PANNE TECHNIQUE [${f.code}] : ${f.name}. Système : ${f.system}. Catégorie : ${f.category}. ` +
      `Description : ${f.description} ` +
      `Gravité : ${f.gravity_label || f.severity}. ` +
      `Fourchette de coût estimée : ${f.cost_min}€ à ${f.cost_max}€. ` +
      `Danger sécuritaire : ${f.is_danger ? 'OUI - Risque sécurité routière ou casse moteur' : 'NON'}.`;

    documents.push({
      doc_id: `fault-${f.code}`,
      doc_type: 'fault',
      fault_code: f.code,
      title: f.name,
      content: text,
      source_id: autodiagSource.id,
      source_name: autodiagSource.name,
      license: autodiagSource.license,
      version: autodiagSource.version,
      metadata: {
        fault_id: f.id,
        fault_code: f.code,
        system: f.system,
        category: f.category,
        severity: f.severity,
        cost_min: f.cost_min,
        cost_max: f.cost_max,
        is_danger: Boolean(f.is_danger)
      }
    });
  }

  // 2. Diagnostic Tests
  console.log('[RAG Export] Exporting diagnostic tests...');
  const [tests] = await pool.query(`
    SELECT dt.*, f.code as fault_code, f.name as fault_name 
    FROM diagnostic_tests dt 
    JOIN faults f ON dt.fault_id = f.id 
    ORDER BY dt.id ASC
  `);
  for (const t of tests) {
    const text = `TEST ET CONTRÔLE [${t.fault_code} - ${t.fault_name}] : ${t.title}. ` +
      `Type de test : ${t.test_type}. ` +
      `Instruction pas-à-pas : ${t.instruction} ` +
      `Résultat attendu / observation : ${t.expected_result} ` +
      `Outils nécessaires : ${t.tools_needed || 'Aucun outil (observation)'}. ` +
      `Durée estimée : ${t.time_est || '5 min'}. ` +
      (t.safety_warning ? `Consignes de sécurité : ${t.safety_warning}` : '');

    documents.push({
      doc_id: `test-${t.id}`,
      doc_type: 'test',
      fault_code: t.fault_code,
      title: t.title,
      content: text,
      source_id: autodiagSource.id,
      source_name: autodiagSource.name,
      license: autodiagSource.license,
      version: autodiagSource.version,
      metadata: {
        test_id: t.id,
        fault_id: t.fault_id,
        fault_code: t.fault_code,
        test_type: t.test_type,
        tools_needed: t.tools_needed,
        time_est: t.time_est,
        safety_warning: t.safety_warning
      }
    });
  }

  // 3. Solutions & Repair Guides
  console.log('[RAG Export] Exporting repair solutions...');
  const [solutions] = await pool.query(`
    SELECT s.*, f.code as fault_code, f.name as fault_name, f.is_danger
    FROM solutions s 
    JOIN faults f ON s.fault_id = f.id 
    ORDER BY s.id ASC
  `);
  for (const s of solutions) {
    let stepsText = '';
    if (s.steps) {
      const parsedSteps = typeof s.steps === 'string' ? JSON.parse(s.steps) : s.steps;
      if (Array.isArray(parsedSteps)) {
        stepsText = parsedSteps.map((step, idx) => {
          if (typeof step === 'string') return `Étape ${idx+1}: ${step}`;
          return `Étape ${step.step_num || idx+1}: ${step.title || ''} - ${step.description || ''}`;
        }).join(' ');
      }
    }

    const text = `SOLUTION ET RÉPARATION [${s.fault_code} - ${s.fault_name}] : ${s.title}. ` +
      (s.subtitle ? `Sous-titre : ${s.subtitle}. ` : '') +
      `Difficulté : ${s.difficulty}. Durée : ${s.est_time}. ` +
      `Coût estimé : ${s.est_cost_min}€ à ${s.est_cost_max}€. ` +
      (s.safety_warning ? `Avertissement sécurité : ${s.safety_warning} ` : '') +
      (stepsText ? `Étapes de réparation : ${stepsText} ` : '') +
      (s.garage_memo_tip ? `Conseil mémo garage : ${s.garage_memo_tip}` : '');

    documents.push({
      doc_id: `solution-${s.id}`,
      doc_type: 'solution',
      fault_code: s.fault_code,
      title: s.title,
      content: text,
      source_id: autodiagSource.id,
      source_name: autodiagSource.name,
      license: autodiagSource.license,
      version: autodiagSource.version,
      metadata: {
        solution_id: s.id,
        fault_id: s.fault_id,
        fault_code: s.fault_code,
        difficulty: s.difficulty,
        est_cost_min: s.est_cost_min,
        est_cost_max: s.est_cost_max,
        est_time: s.est_time,
        safety_warning: s.safety_warning,
        is_danger: Boolean(s.is_danger)
      }
    });
  }

  // 4. DTC Codes (Common generic OBD-II Powertrain codes P0000 - P0999 with full descriptions)
  console.log('[RAG Export] Exporting standard OBD-II DTC codes...');
  const [dtcs] = await pool.query(`
    SELECT code, title, system, description, possible_causes, urgency, garage_advice, repair_info, bilingual_title
    FROM dtc_codes 
    WHERE (code LIKE 'P0%' OR code LIKE 'P1%' OR code IN ('B0001', 'C0035', 'U0100'))
      AND description IS NOT NULL 
      AND CHAR_LENGTH(description) > 40
    ORDER BY 
      CASE WHEN code IN ('P0300', 'P0301', 'P0302', 'P0303', 'P0304', 'P0420', 'P0562', 'P0171', 'P0101', 'P0133', 'P0401', 'P0700', 'B0001', 'C0035', 'U0100') THEN 0 ELSE 1 END,
      code ASC
    LIMIT 350
  `);

  for (const d of dtcs) {
    let causesText = '';
    if (d.possible_causes) {
      try {
        const causes = typeof d.possible_causes === 'string' ? JSON.parse(d.possible_causes) : d.possible_causes;
        if (Array.isArray(causes)) causesText = causes.slice(0, 4).join(', ');
      } catch (_) {}
    }

    let frTitle = d.title;
    if (d.bilingual_title) {
      try {
        const bt = typeof d.bilingual_title === 'string' ? JSON.parse(d.bilingual_title) : d.bilingual_title;
        if (bt && bt.fr) frTitle = `${d.code} - ${bt.fr}`;
        else if (bt && bt.en) frTitle = `${d.code} - ${bt.en}`;
      } catch (_) {}
    }

    const text = `CODE DÉFAUT OBD-II [${d.code}] : ${frTitle}. Système : ${d.system}. ` +
      `Description technique : ${d.description} ` +
      (causesText ? `Causes fréquentes : ${causesText}. ` : '') +
      `Urgence : ${d.urgency || 'Modérée'}. ` +
      (d.garage_advice ? `Recommandation atelier : ${d.garage_advice}` : '');

    documents.push({
      doc_id: `dtc-${d.code}`,
      doc_type: 'dtc',
      fault_code: d.code,
      title: `${d.code}: ${frTitle}`,
      content: text,
      source_id: saeSource.id,
      source_name: saeSource.name,
      license: saeSource.license,
      version: saeSource.version,
      metadata: {
        code: d.code,
        system: d.system,
        urgency: d.urgency,
        causes: causesText
      }
    });
  }

  // 5. Save exported documents to data/tech_documents.json
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'tech_documents.json');
  fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2), 'utf8');

  console.log(`[RAG Export] Exported ${documents.length} technical documents to ${outputPath}`);
  console.log(`  - Faults: ${faults.length}`);
  console.log(`  - Diagnostic Tests: ${tests.length}`);
  console.log(`  - Solutions: ${solutions.length}`);
  console.log(`  - DTC Codes: ${dtcs.length}`);

  process.exit(0);
}

exportRAGDocuments().catch(err => {
  console.error('[RAG Export] Error:', err);
  process.exit(1);
});
