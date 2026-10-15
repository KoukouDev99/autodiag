const { initDatabase, getPool } = require('../backend/src/db/db');

async function applyPerformanceIndexes() {
  await initDatabase();
  const pool = getPool();

  console.log('[Performance] Applying strategic database indexes...');

  const indexDefinitions = [
    // 1. DTC Codes
    { table: 'dtc_codes', name: 'idx_dtc_type', sql: 'ALTER TABLE dtc_codes ADD INDEX idx_dtc_type (type)' },
    { table: 'dtc_codes', name: 'idx_dtc_system', sql: 'ALTER TABLE dtc_codes ADD INDEX idx_dtc_system (system)' },
    { table: 'dtc_codes', name: 'idx_dtc_urgency', sql: 'ALTER TABLE dtc_codes ADD INDEX idx_dtc_urgency (urgency)' },

    // 2. Car Catalog
    { table: 'car_catalog', name: 'idx_catalog_make_model', sql: 'ALTER TABLE car_catalog ADD INDEX idx_catalog_make_model (make, model)' },
    { table: 'car_catalog', name: 'idx_catalog_make_group', sql: 'ALTER TABLE car_catalog ADD INDEX idx_catalog_make_group (make_group)' },

    // 3. Faults & Symptoms
    { table: 'faults', name: 'idx_faults_system', sql: 'ALTER TABLE faults ADD INDEX idx_faults_system (system)' },
    { table: 'faults', name: 'idx_faults_danger', sql: 'ALTER TABLE faults ADD INDEX idx_faults_danger (is_danger)' },
    { table: 'faults', name: 'idx_faults_severity', sql: 'ALTER TABLE faults ADD INDEX idx_faults_severity (severity)' },
    { table: 'fault_symptoms', name: 'idx_fs_lookup', sql: 'ALTER TABLE fault_symptoms ADD INDEX idx_fs_lookup (symptom_id, is_primary, relevance_score)' },

    // 4. Diagnostic Rules & Questions
    { table: 'diagnostic_rules', name: 'idx_rules_lookup', sql: 'ALTER TABLE diagnostic_rules ADD INDEX idx_rules_lookup (question_id, answer_option_id, fault_id)' },
    { table: 'diagnostic_questions', name: 'idx_dq_symptom_step', sql: 'ALTER TABLE diagnostic_questions ADD INDEX idx_dq_symptom_step (symptom_id, step_num)' },
    { table: 'answer_options', name: 'idx_ao_question_order', sql: 'ALTER TABLE answer_options ADD INDEX idx_ao_question_order (question_id, order_index)' },

    // 5. Sessions & Answers
    { table: 'diagnostic_sessions', name: 'idx_sessions_user_status', sql: 'ALTER TABLE diagnostic_sessions ADD INDEX idx_sessions_user_status (user_id, status, created_at)' },
    { table: 'session_answers', name: 'idx_answers_session_q', sql: 'ALTER TABLE session_answers ADD INDEX idx_answers_session_q (session_id, question_id)' },

    // 6. Tests & Solutions
    { table: 'diagnostic_tests', name: 'idx_dt_fault', sql: 'ALTER TABLE diagnostic_tests ADD INDEX idx_dt_fault (fault_id)' },
    { table: 'solutions', name: 'idx_sol_fault', sql: 'ALTER TABLE solutions ADD INDEX idx_sol_fault (fault_id)' }
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const item of indexDefinitions) {
    try {
      // Check if index already exists
      const [existing] = await pool.query(
        `SELECT COUNT(*) as count 
         FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = ? 
           AND INDEX_NAME = ?`,
        [item.table, item.name]
      );

      if (existing[0].count > 0) {
        console.log(`  - [ALREADY EXISTS] ${item.table}.${item.name}`);
        skippedCount++;
      } else {
        await pool.query(item.sql);
        console.log(`  + [ADDED] ${item.table}.${item.name}`);
        addedCount++;
      }
    } catch (err) {
      console.warn(`  ! [WARN] Could not apply ${item.table}.${item.name}: ${err.message}`);
    }
  }

  console.log(`[Performance] Indexes applied: ${addedCount} added, ${skippedCount} already existed.`);
  process.exit(0);
}

applyPerformanceIndexes().catch(err => {
  console.error('[Performance] Error:', err);
  process.exit(1);
});
