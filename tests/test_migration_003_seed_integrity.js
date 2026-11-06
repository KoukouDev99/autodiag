/**
 * Test de non-régression - Migration 003
 * Vérifie que les opérations de seed de connaissances ne tronquent JAMAIS
 * les réponses utilisateur existantes (session_answers).
 */
const mysql = require('C:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto/backend/node_modules/mysql2/promise');
const assert = require('assert');

async function testSeedIntegrity() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  console.log('🧪 Test Migration 003 : Vérification intégrité seed vs session_answers...');

  // 1. Vérifier qu'aucune session 'completed' n'a 0 réponses (hors les 4 identifiées avant migration 002)
  const [activeCompletedEmpty] = await conn.query(`
    SELECT id, symptom_id, status, created_at
    FROM diagnostic_sessions
    WHERE status = 'completed'
      AND id NOT IN (SELECT DISTINCT session_id FROM session_answers)
      AND id NOT IN (96, 97, 162, 163)
  `);

  assert.strictEqual(
    activeCompletedEmpty.length,
    0,
    `Échec : ${activeCompletedEmpty.length} nouvelles sessions 'completed' ont 0 réponses !`
  );

  console.log('✓ Succès : Aucune nouvelle session orpheline 0-réponse détectée.');
  await conn.end();
}

testSeedIntegrity().catch(err => {
  console.error('❌ Échec test Migration 003 :', err.message);
  process.exit(1);
});
