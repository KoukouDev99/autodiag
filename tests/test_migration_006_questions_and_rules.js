/**
 * Test de validation & non-régression - Migration 006
 * Valide l'unification des questions, options de réponses, règles déterministes,
 * solutions et tests diagnostiques, ainsi que la réversibilité complète du rollback.
 */
const mysql = require('c:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto/backend/node_modules/mysql2/promise');
const fs = require('fs');
const assert = require('assert');

async function testMigration006() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev',
    multipleStatements: true
  });

  console.log('🧪 Test Migration 006 : Démarrage du banc de validation...');

  // 1. Exécution de la migration 006
  console.log('  -> Exécution de 006_migrate_questions_and_rules.sql...');
  const migrationSql = fs.readFileSync('db/migrations/006_migrate_questions_and_rules.sql', 'utf8');
  await conn.query(migrationSql);

  // 2. Contrôle du nombre de questions (15 + 110 = 125)
  const [dqCount] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_questions');
  console.log(`  -> diagnostic_questions : ${dqCount[0].count} (attendu: 125)`);
  assert.strictEqual(dqCount[0].count, 125, `Échec : attendu 125 questions, trouvé ${dqCount[0].count}`);

  // 3. Contrôle de la couverture des symptômes (tous les symptômes de 1 à 64 ont des questions)
  const [symptomsWithoutQuestions] = await conn.query(`
    SELECT s.id, s.label
    FROM symptoms s
    LEFT JOIN diagnostic_questions dq ON s.id = dq.symptom_id
    WHERE dq.id IS NULL
  `);
  console.log(`  -> Symptômes sans question dans diagnostic_questions : ${symptomsWithoutQuestions.length}`);
  assert.strictEqual(symptomsWithoutQuestions.length, 0, `Échec : ${symptomsWithoutQuestions.length} symptômes n'ont aucune question !`);

  // 4. Contrôle du nombre d'options de réponses (40 + 220 = 260)
  const [aoCount] = await conn.query('SELECT COUNT(*) as count FROM answer_options');
  console.log(`  -> answer_options : ${aoCount[0].count} (attendu: 260)`);
  assert.strictEqual(aoCount[0].count, 260, `Échec : attendu 260 options, trouvé ${aoCount[0].count}`);

  // 5. Contrôle du nombre de règles de diagnostic (101 + 110 = 211)
  const [drCount] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_rules');
  console.log(`  -> diagnostic_rules : ${drCount[0].count} (attendu: 211)`);
  assert.strictEqual(drCount[0].count, 211, `Échec : attendu 211 règles, trouvé ${drCount[0].count}`);

  // 6. Contrôle d'intégrité référentielle des règles
  const [orphanRules] = await conn.query(`
    SELECT r.id
    FROM diagnostic_rules r
    LEFT JOIN diagnostic_questions q ON r.question_id = q.id
    LEFT JOIN answer_options a ON r.answer_option_id = a.id
    LEFT JOIN faults f ON r.fault_id = f.id
    WHERE q.id IS NULL OR a.id IS NULL OR f.id IS NULL
  `);
  console.log(`  -> Règles orphelines (question, option ou fault manquante) : ${orphanRules.length}`);
  assert.strictEqual(orphanRules.length, 0, `Échec : ${orphanRules.length} règles orphelines détectées !`);

  // 7. Contrôle du nombre de solutions et de tests (47 de chaque, 1 par panne)
  const [solCount] = await conn.query('SELECT COUNT(*) as count FROM solutions');
  const [testCount] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_tests');
  console.log(`  -> solutions : ${solCount[0].count} (attendu: 47)`);
  console.log(`  -> diagnostic_tests : ${testCount[0].count} (attendu: 47)`);
  assert.strictEqual(solCount[0].count, 47, `Échec : attendu 47 solutions, trouvé ${solCount[0].count}`);
  assert.strictEqual(testCount[0].count, 47, `Échec : attendu 47 tests, trouvé ${testCount[0].count}`);

  // 8. Test de réversibilité (Rollback)
  console.log('  -> Test de réversibilité (Exécution du Rollback 006)...');
  const rollbackSql = fs.readFileSync('db/rollback/006_migrate_questions_and_rules_rollback.sql', 'utf8');
  await conn.query(rollbackSql);

  const [dqRollback] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_questions');
  const [aoRollback] = await conn.query('SELECT COUNT(*) as count FROM answer_options');
  const [drRollback] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_rules');
  const [solRollback] = await conn.query('SELECT COUNT(*) as count FROM solutions');
  const [testRollback] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_tests');

  assert.strictEqual(dqRollback[0].count, 15, `Rollback échoué : questions attendues 15, trouvé ${dqRollback[0].count}`);
  assert.strictEqual(aoRollback[0].count, 40, `Rollback échoué : options attendues 40, trouvé ${aoRollback[0].count}`);
  assert.strictEqual(drRollback[0].count, 101, `Rollback échoué : règles attendues 101, trouvé ${drRollback[0].count}`);
  assert.strictEqual(solRollback[0].count, 19, `Rollback échoué : solutions attendues 19, trouvé ${solRollback[0].count}`);
  assert.strictEqual(testRollback[0].count, 19, `Rollback échoué : tests attendus 19, trouvé ${testRollback[0].count}`);
  console.log('  -> Rollback validé : Base restaurée à l\'état initial sans résidu.');

  // 9. Ré-application définitive
  console.log('  -> Ré-application définitive de 006_migrate_questions_and_rules.sql...');
  await conn.query(migrationSql);

  const [finalDq] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_questions');
  assert.strictEqual(finalDq[0].count, 125);

  console.log('✓ Succès : Migration 006 et Rollback 006 validés avec succès à 100% !');
  await conn.end();
}

testMigration006().catch(err => {
  console.error('❌ Échec test Migration 006 :', err);
  process.exit(1);
});
