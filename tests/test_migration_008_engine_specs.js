/**
 * Test de non-régression & validation - Migration 008 (Phase 4b)
 * Vérifie :
 * 1. L'application de la migration 008 (index car_specs_engines, colonnes fault_vehicles)
 * 2. La conformité stricte de la règle PureTech (evidence_level='unverified', source_record_id=NULL, TODO)
 * 3. L'évaluation déterministe dans DiagnosticEngine (boost unverified PureTech, exclusion physique EVAP & Embrayage)
 * 4. La réversibilité (Rollback complet)
 * 5. La ré-application finale propre
 */
const mysql = require('c:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto/backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const DiagnosticEngine = require('../backend/src/services/diagnosticEngine');

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

async function testMigration008() {
  console.log('=== TEST MIGRATION 008 - PHASE 4b ===\n');

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  try {
    const migFile = path.resolve(__dirname, '../db/migrations/008_engine_specs_compatibility.sql');
    const rollFile = path.resolve(__dirname, '../db/rollback/008_engine_specs_compatibility_rollback.sql');

    // Détection si déjà appliqué -> rollback initial pour tester l'aller
    const [cols] = await conn.query("SHOW COLUMNS FROM fault_vehicles LIKE 'evidence_level'");
    if (cols.length > 0) {
      console.log('  [Init] Détection d\'une base déjà migrée en 008 -> Rollback initial...');
      await runStatements(conn, rollFile);
    }

    // 1. Application de la migration 008
    console.log('[1/5] Application de la migration 008...');
    await runStatements(conn, migFile);
    console.log('  -> Migration 008 exécutée avec succès.');

    // 2. Contrôle des colonnes et index
    console.log('\n[2/5] Vérification du schéma (colonnes et index)...');
    const [colsAfter] = await conn.query("SHOW COLUMNS FROM fault_vehicles LIKE 'evidence_level'");
    assert.strictEqual(colsAfter.length, 1, 'Colonne evidence_level doit exister dans fault_vehicles');

    const [srcCols] = await conn.query("SHOW COLUMNS FROM fault_vehicles LIKE 'source_record_id'");
    assert.strictEqual(srcCols.length, 1, 'Colonne source_record_id doit exister dans fault_vehicles');

    const [idxRows] = await conn.query("SHOW INDEX FROM car_specs_engines WHERE Key_name = 'idx_name'");
    assert(idxRows.length > 0, 'Index idx_name doit exister sur car_specs_engines');

    const [fkRows] = await conn.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'autodiag_dev' 
        AND TABLE_NAME = 'fault_vehicles' 
        AND CONSTRAINT_NAME = 'fk_fv_source'
    `);
    assert(fkRows.length > 0, 'Clé étrangère fk_fv_source manquante sur fault_vehicles');
    console.log('  -> Colonnes, index et clé étrangère fk_fv_source validés.');

    // 3. Contrôle strict de la règle PureTech (Refus d'invention mécanique)
    console.log('\n[3/5] Contrôle des règles fault_vehicles (PureTech & exclusions)...');
    const [pureTechRows] = await conn.query(`
      SELECT * FROM fault_vehicles WHERE engine_code = '1.2 PureTech'
    `);
    assert.ok(pureTechRows.length >= 2, 'Au moins 2 règles PureTech (Peugeot / Citroën) doivent exister');
    for (const r of pureTechRows) {
      assert.strictEqual(r.evidence_level, 'unverified', 'La ligne PureTech DOIT être evidence_level = unverified');
      assert.strictEqual(r.source_record_id, null, 'source_record_id DOIT être NULL');
      assert.ok(r.notes && r.notes.includes('TODO'), 'La mention TODO DOIT être présente dans notes');
    }
    console.log('  -> Règle PureTech conforme : evidence_level="unverified", source_record_id=NULL, mention TODO présente.');

    // 4. Test d'évaluation du moteur déterministe avec les compatibilités
    console.log('\n[4/5] Test de calcul déterministe dans DiagnosticEngine...');
    const [compatibilities] = await conn.query('SELECT * FROM fault_vehicles');
    const dummyHypotheses = [
      { id: 310, name: 'Courroie ou chaîne de distribution décalée / usée', order_index: 1 },
      { id: 318, name: 'Électrovanne de purge canister EVAP bloquée', order_index: 2 },
      { id: 324, name: 'Émetteur ou récepteur hydraulique d\'embrayage fuyard', order_index: 3 },
      { id: 5, name: 'Bougies d\'allumage usées', order_index: 4 }
    ];

    // Véhicule A : Peugeot 208 1.2 PureTech (75 000 km)
    const vehPureTech = { brand: 'Peugeot', model: '208', fuel: 'Essence', engine: '1.2 PureTech', year: 2020, mileage: 75000 };
    const evalPureTech = DiagnosticEngine.evaluate(dummyHypotheses, [], vehPureTech, [], compatibilities);
    const pureTechHypo = evalPureTech.hypotheses.find(h => h.id === 310);
    assert.ok(pureTechHypo, 'Hypothèse 310 doit être présente');
    assert.ok(pureTechHypo.reasoning.some(r => r.includes('Signalé en retour atelier') && r.includes('+10 pts')), 'La règle unverified doit apporter +10 pts');
    console.log('  -> Test Peugeot 1.2 PureTech : Boost de 10 pts et mention unverified validés.');

    // Véhicule B : Renault Clio Diesel (80 000 km)
    const vehDiesel = { brand: 'Renault', model: 'Clio', fuel: 'Diesel', engine: '1.5 dCi', year: 2018, mileage: 80000 };
    const evalDiesel = DiagnosticEngine.evaluate(dummyHypotheses, [], vehDiesel, [], compatibilities);
    const evapDiesel = evalDiesel.eliminated_hypotheses.find(h => h.id === 318);
    assert.ok(evapDiesel, 'Canister EVAP doit être éliminé sur Diesel');
    console.log('  -> Test Renault Diesel : Exclusion physique du Canister EVAP validée.');

    // Véhicule C : Véhicule 100% Électrique
    const vehElec = { brand: 'Tesla', model: 'Model 3', fuel: 'Électrique', engine: 'Dual Motor', year: 2021, mileage: 40000 };
    const evalElec = DiagnosticEngine.evaluate(dummyHypotheses, [], vehElec, [], compatibilities);
    const cltElec = evalElec.eliminated_hypotheses.find(h => h.id === 324);
    assert.ok(cltElec, 'Embrayage doit être éliminé sur véhicule électrique');
    console.log('  -> Test Véhicule Électrique : Exclusion de l\'embrayage validée.');

    // 5. Test de réversibilité (Rollback) & Ré-application
    console.log('\n[5/5] Test de réversibilité (Rollback 008) et ré-application...');
    await runStatements(conn, rollFile);
    const [colsRollback] = await conn.query("SHOW COLUMNS FROM fault_vehicles LIKE 'evidence_level'");
    assert.strictEqual(colsRollback.length, 0, 'evidence_level doit être supprimée après rollback');
    const [rulesRollback] = await conn.query('SELECT COUNT(*) as count FROM fault_vehicles WHERE id >= 23');
    assert.strictEqual(rulesRollback[0].count, 0, 'Les règles >= 23 doivent être supprimées après rollback');
    console.log('  -> Rollback 008 vérifié avec succès.');

    await runStatements(conn, migFile);
    const [colsFinal] = await conn.query("SHOW COLUMNS FROM fault_vehicles LIKE 'evidence_level'");
    assert.strictEqual(colsFinal.length, 1, 'evidence_level doit être ré-appliquée');
    console.log('  -> Migration 008 ré-appliquée proprement.');

    console.log('\n==========================================');
    console.log('  TOUS LES TESTS PHASE 4b SONT VALIDÉS !   ');
    console.log('==========================================\n');
  } finally {
    await conn.end();
  }
}

testMigration008().catch(err => {
  console.error('\n❌ Échec du test Migration 008 :', err);
  process.exit(1);
});
