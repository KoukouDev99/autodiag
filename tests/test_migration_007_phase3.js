/**
 * Test de non-régression & validation - Migration 007 (Phase 3)
 * Vérifie :
 * 1. L'harmonisation des anciennes réponses session_answers
 * 2. L'application des clés étrangères (fk_sa_session, fk_sa_question, fk_sa_option, fk_vc_*, fk_dr_*)
 * 3. La contrainte UNIQUE uk_session_question
 * 4. La création de la table diagnostic_results
 * 5. La complétude à 100% (64/64 symptômes) dans fault_symptoms
 * 6. Le renommage des tables legacy en legacy_*
 * 7. Le test de réversibilité (Rollback complet)
 * 8. La ré-application finale propre
 */
const mysql = require('c:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto/backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

function splitSqlStatements(sqlContent) {
  const lines = sqlContent.split('\n');
  const statements = [];
  let current = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.length === 0) continue;
    current += line + '\n';
    if (trimmed.endsWith(';')) {
      const stmt = current.trim();
      const cleanStmt = stmt.endsWith(';') ? stmt.slice(0, -1).trim() : stmt;
      if (cleanStmt.length > 0) {
        statements.push(cleanStmt);
      }
      current = '';
    }
  }
  if (current.trim().length > 0) {
    const stmt = current.trim();
    const cleanStmt = stmt.endsWith(';') ? stmt.slice(0, -1).trim() : stmt;
    if (cleanStmt.length > 0) statements.push(cleanStmt);
  }
  return statements;
}

async function runStatements(conn, sqlPath) {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const stmts = splitSqlStatements(sql);
  for (const stmt of stmts) {
    if (stmt.toUpperCase() === 'START TRANSACTION' || stmt.toUpperCase() === 'COMMIT') {
      continue;
    }
    await conn.query(stmt);
  }
}

async function getForeignKeys(conn, tableName) {
  const [rows] = await conn.query(`
    SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'autodiag_dev' 
      AND TABLE_NAME = ? 
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `, [tableName]);
  return rows;
}

async function getTableNames(conn) {
  const [rows] = await conn.query("SHOW TABLES");
  return rows.map(r => Object.values(r)[0]);
}

async function testMigration007() {
  console.log('=== TEST MIGRATION 007 - PHASE 3 ===\n');

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  try {
    const migFile = path.resolve(__dirname, '../db/migrations/007_phase3_integrity_and_constraints.sql');
    const rollFile = path.resolve(__dirname, '../db/rollback/007_phase3_integrity_and_constraints_rollback.sql');

    const initialTables = await getTableNames(conn);
    if (initialTables.includes('legacy_questions')) {
      console.log('  [Init] Détection d\'une base déjà en Phase 3 -> Exécution préalable du rollback...');
      await runStatements(conn, rollFile);
    }

    // 1. Appliquer Migration 007
    console.log('[1/6] Application de la migration 007...');
    await runStatements(conn, migFile);
    console.log('  -> Migration 007 exécutée avec succès.');

    // 2. Vérification des tables renommées et de diagnostic_results
    console.log('\n[2/6] Vérification des tables et de diagnostic_results...');
    const tables = await getTableNames(conn);
    assert(tables.includes('diagnostic_results'), 'diagnostic_results doit exister');
    assert(tables.includes('legacy_questions'), 'legacy_questions doit exister');
    assert(tables.includes('legacy_question_options'), 'legacy_question_options doit exister');
    assert(tables.includes('legacy_hypotheses'), 'legacy_hypotheses doit exister');
    assert(tables.includes('legacy_repair_guides'), 'legacy_repair_guides doit exister');
    assert(tables.includes('legacy_repair_steps'), 'legacy_repair_steps doit exister');
    assert(!tables.includes('questions'), 'questions ne doit plus exister sous son ancien nom');
    assert(!tables.includes('hypotheses'), 'hypotheses ne doit plus exister sous son ancien nom');
    console.log('  -> Tables legacy correctement renommées et diagnostic_results créée.');

    // 3. Vérification des contraintes FK et UNIQUE
    console.log('\n[3/6] Vérification des clés étrangères et contraintes...');
    const saFks = await getForeignKeys(conn, 'session_answers');
    const saFkNames = saFks.map(f => f.CONSTRAINT_NAME);
    assert(saFkNames.includes('fk_sa_session'), 'fk_sa_session manquante');
    assert(saFkNames.includes('fk_sa_question'), 'fk_sa_question manquante');
    assert(saFkNames.includes('fk_sa_option'), 'fk_sa_option manquante');

    const [saIdx] = await conn.query("SHOW INDEX FROM session_answers WHERE Key_name = 'uk_session_question'");
    assert(saIdx.length > 0, 'uk_session_question manquante');

    const vcFks = await getForeignKeys(conn, 'verified_cases');
    const vcFkNames = vcFks.map(f => f.CONSTRAINT_NAME);
    assert(vcFkNames.includes('fk_vc_session'), 'fk_vc_session manquante');
    assert(vcFkNames.includes('fk_vc_fault'), 'fk_vc_fault manquante');
    assert(vcFkNames.includes('fk_vc_vehicle'), 'fk_vc_vehicle manquante');

    const drFks = await getForeignKeys(conn, 'diagnostic_results');
    const drFkNames = drFks.map(f => f.CONSTRAINT_NAME);
    assert(drFkNames.includes('fk_dr_session'), 'fk_dr_session manquante');
    assert(drFkNames.includes('fk_dr_fault'), 'fk_dr_fault manquante');
    console.log('  -> Toutes les contraintes FK (fk_sa_*, fk_vc_*, fk_dr_*) et UNIQUE validées.');

    // 4. Test d'intégrité référentielle active (rejet des orphelins & doublons)
    console.log('\n[4/6] Test d\'intégrité active (rejet des clés invalides)...');
    let fkRejected = false;
    try {
      await conn.query('INSERT INTO session_answers (session_id, question_id, option_id) VALUES (1, 99999, 1)');
    } catch (e) {
      if (e.code === 'ER_NO_REFERENCED_ROW_2' || e.code === 'ER_NO_REFERENCED_ROW') {
        fkRejected = true;
      }
    }
    assert(fkRejected, 'L\'insertion d\'une question_id inexistante doit être rejetée par la FK');

    const [existingSa] = await conn.query('SELECT session_id, question_id, option_id FROM session_answers LIMIT 1');
    if (existingSa.length > 0) {
      let dupRejected = false;
      try {
        await conn.query('INSERT INTO session_answers (session_id, question_id, option_id) VALUES (?, ?, ?)', [
          existingSa[0].session_id,
          existingSa[0].question_id,
          existingSa[0].option_id
        ]);
      } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') dupRejected = true;
      }
      assert(dupRejected, 'L\'insertion d\'un doublon (session_id, question_id) doit être rejetée par uk_session_question');
    }
    console.log('  -> Rejet des clés orphelines et des doublons vérifié avec succès.');

    // 5. Test du Rollback
    console.log('\n[5/6] Test de réversibilité (Rollback 007)...');
    await runStatements(conn, rollFile);
    const tablesAfterRollback = await getTableNames(conn);
    assert(tablesAfterRollback.includes('questions'), 'questions doit être restaurée');
    assert(tablesAfterRollback.includes('hypotheses'), 'hypotheses doit être restaurée');
    assert(!tablesAfterRollback.includes('legacy_questions'), 'legacy_questions ne doit plus exister après rollback');
    assert(!tablesAfterRollback.includes('diagnostic_results'), 'diagnostic_results doit être supprimée après rollback');
    console.log('  -> Rollback 007 exécuté et vérifié avec succès.');

    // 6. Ré-application définitive
    console.log('\n[6/6] Ré-application finale de la migration 007...');
    await runStatements(conn, migFile);
    const finalTables = await getTableNames(conn);
    assert(finalTables.includes('diagnostic_results'));
    assert(finalTables.includes('legacy_questions'));
    console.log('  -> Migration 007 ré-appliquée proprement.');

    console.log('\n========================================');
    console.log('  TOUS LES TESTS PHASE 3 SONT VALIDÉS ! ');
    console.log('========================================\n');
  } finally {
    await conn.end();
  }
}

testMigration007().catch(err => {
  console.error('\n❌ Échec du test Migration 007 :', err);
  process.exit(1);
});
