const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { getPool, initDatabase } = require('./db');

async function seedDiagnosticKnowledgeBase() {
  console.log('[KB SEED] Starting Diagnostic Knowledge Base seeding...');
  
  const pool = await initDatabase();
  const kbDataPath = path.join(__dirname, 'diagnostic_kb.json');
  if (!fs.existsSync(kbDataPath)) {
    throw new Error('diagnostic_kb.json not found at ' + kbDataPath);
  }

  const items = JSON.parse(fs.readFileSync(kbDataPath, 'utf8'));
  console.log(`[KB SEED] Loaded ${items.length} diagnostic items from JSON.`);

  // 1. Create a dedicated diagnostic_kb table for fast indexing & search
  await pool.query(`
    CREATE TABLE IF NOT EXISTS diagnostic_kb (
      id VARCHAR(100) PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      category_id VARCHAR(50) NOT NULL,
      subcategory VARCHAR(150) NOT NULL,
      icon VARCHAR(50) DEFAULT 'wrench',
      symptoms JSON NOT NULL,
      gravity VARCHAR(80) NOT NULL,
      priority_badge VARCHAR(50) NOT NULL,
      priority_label VARCHAR(50) NOT NULL,
      cost_min INT NOT NULL,
      cost_max INT NOT NULL,
      cost_currency VARCHAR(10) DEFAULT '€',
      check_type VARCHAR(100) NOT NULL,
      check_action TEXT NOT NULL,
      safety_warning TEXT,
      diagnosis_steps JSON NOT NULL,
      repair_guide JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category (category_id),
      INDEX idx_subcategory (subcategory)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log('[KB SEED] Table diagnostic_kb ready.');

  // 2. Insert or update each item in diagnostic_kb
  for (const item of items) {
    await pool.query(
      `INSERT INTO diagnostic_kb (
        id, category, category_id, subcategory, icon, symptoms,
        gravity, priority_badge, priority_label, cost_min, cost_max,
        cost_currency, check_type, check_action, safety_warning,
        diagnosis_steps, repair_guide
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        category = VALUES(category),
        category_id = VALUES(category_id),
        subcategory = VALUES(subcategory),
        icon = VALUES(icon),
        symptoms = VALUES(symptoms),
        gravity = VALUES(gravity),
        priority_badge = VALUES(priority_badge),
        priority_label = VALUES(priority_label),
        cost_min = VALUES(cost_min),
        cost_max = VALUES(cost_max),
        cost_currency = VALUES(cost_currency),
        check_type = VALUES(check_type),
        check_action = VALUES(check_action),
        safety_warning = VALUES(safety_warning),
        diagnosis_steps = VALUES(diagnosis_steps),
        repair_guide = VALUES(repair_guide)`,
      [
        item.id,
        item.category,
        item.category_id,
        item.subcategory,
        item.icon || 'wrench',
        JSON.stringify(item.symptoms || []),
        item.gravity || 'Moderate · Inspection Required',
        item.priority_badge || 'PRIORITY 1',
        item.priority_label || 'Top Suspect',
        item.cost_min || 0,
        item.cost_max || 0,
        item.cost_currency || '€',
        item.check_type || 'Visual · Easy',
        item.check_action || '',
        item.safety_warning || '',
        JSON.stringify(item.diagnosis_steps || []),
        JSON.stringify(item.repair_guide || {})
      ]
    );
  }

  console.log(`[KB SEED] Inserted/Updated ${items.length} records in diagnostic_kb table.`);

  // 3. Ensure standard symptoms table has matching categories if user creates guided sessions
  for (const item of items) {
    const primarySymptom = item.symptoms && item.symptoms[0] ? item.symptoms[0] : item.subcategory;
    const code = item.id.replace(/[^a-z0-9_]/gi, '_').toLowerCase();

    const [existing] = await pool.query('SELECT id FROM symptoms WHERE code = ?', [code]);
    let symptomId;
    if (existing.length === 0) {
      const [res] = await pool.query(
        `INSERT INTO symptoms (code, label, category, icon, description, is_critical)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          code,
          primarySymptom,
          item.category,
          item.icon || 'wrench',
          item.check_action,
          item.gravity.toLowerCase().includes('critical') ? 1 : 0
        ]
      );
      symptomId = res.insertId;

      // Insert matching hypothesis
      const [hypRes] = await pool.query(
        `INSERT INTO hypotheses (symptom_id, name, priority_badge, priority_label, order_index, description, gravity, check_action, check_type, cost_min, cost_max, cost_currency, is_danger)
         VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          symptomId,
          item.subcategory,
          item.priority_badge,
          item.priority_label,
          `Failure in ${item.subcategory} matches observed symptoms: ${item.symptoms.join(', ')}.`,
          item.gravity,
          item.check_action,
          item.check_type,
          item.cost_min,
          item.cost_max,
          item.cost_currency,
          item.gravity.toLowerCase().includes('critical') ? 1 : 0
        ]
      );
      const hypId = hypRes.insertId;

      // Insert questions
      if (item.diagnosis_steps && item.diagnosis_steps.length > 0) {
        for (let i = 0; i < item.diagnosis_steps.length; i++) {
          const step = item.diagnosis_steps[i];
          const [qRes] = await pool.query(
            `INSERT INTO questions (symptom_id, step_num, total_steps, category, title, description, warning_text)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              symptomId,
              i + 1,
              item.diagnosis_steps.length,
              item.category,
              step.title || step.step,
              step.description || `Perform check: ${step.step}`,
              step.warning || item.safety_warning || ''
            ]
          );
          const qId = qRes.insertId;

          // Insert options
          if (step.results && step.results.length > 0) {
            for (let j = 0; j < step.results.length; j++) {
              const resOpt = step.results[j];
              const weights = resOpt.is_fault ? { [hypId]: resOpt.score_weight || 15 } : {};
              await pool.query(
                `INSERT INTO question_options (question_id, title, subtitle, icon, is_default, hypothesis_weights)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                  qId,
                  resOpt.label,
                  resOpt.explanation || resOpt.recommended_action || '',
                  resOpt.is_fault ? 'alert' : 'check',
                  j === 0 ? 1 : 0,
                  JSON.stringify(weights)
                ]
              );
            }
          }
        }
      }

      // Insert repair guide
      if (item.repair_guide) {
        const guide = item.repair_guide;
        const [guideRes] = await pool.query(
          `INSERT INTO repair_guides (hypothesis_id, title, subtitle, difficulty, est_time, total_steps, safety_warning, tools_needed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            hypId,
            guide.title,
            `Inspection and repair guide for ${item.subcategory}`,
            guide.difficulty,
            guide.est_time,
            guide.steps ? guide.steps.length : 1,
            guide.safety_warning || '',
            JSON.stringify(guide.tools_needed || [])
          ]
        );
        const guideId = guideRes.insertId;

        if (guide.steps && guide.steps.length > 0) {
          for (const s of guide.steps) {
            await pool.query(
              `INSERT INTO repair_steps (guide_id, step_num, title, time_est, description, caution_warning)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [
                guideId,
                s.step_num,
                s.title,
                guide.est_time,
                s.description,
                s.caution || ''
              ]
            );
          }
        }
      }
    }
  }

  console.log('[KB SEED] Seeding successfully completed!');
  process.exit(0);
}

seedDiagnosticKnowledgeBase().catch(err => {
  console.error('[KB SEED ERROR]', err);
  process.exit(1);
});
