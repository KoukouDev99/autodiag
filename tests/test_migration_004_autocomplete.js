/**
 * Test de non-régression - Migration 004
 * Vérifie qu'une session sans question ne passe JAMAIS au statut 'completed'
 * avec 0 réponse, mais reçoit le statut explicite 'no_questions_available'.
 */
const mysql = require('C:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto/backend/node_modules/mysql2/promise');
const assert = require('assert');

async function testAutoCompleteGuard() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  console.log('🧪 Test Migration 004 : Vérification garde auto-complete...');

  const TEST_SYMPTOM_ID = 9999;
  let testSessionId = null;

  try {
    // 1. Créer un symptôme de test temporaire qui n'a AUCUNE question dans diagnostic_questions ni questions
    await conn.query(`
      INSERT INTO symptoms (id, code, label, category, icon, description)
      VALUES (?, 'test_no_q', 'Symptôme de test sans questions', 'Test', 'help', 'Description test')
      ON DUPLICATE KEY UPDATE label = VALUES(label)
    `, [TEST_SYMPTOM_ID]);

    // 2. Créer une session pour ce symptôme
    const [res] = await conn.query(`
      INSERT INTO diagnostic_sessions (user_id, vehicle_id, symptom_id, status, current_step, summary_title, summary_desc)
      VALUES (1, 25, ?, 'in_progress', 1, 'Test Migration 004', 'Vérification garde auto-complete')
    `, [TEST_SYMPTOM_ID]);
    testSessionId = res.insertId;

    // 3. Appeler la route GET /api/diagnostic/:sessionId/question
    const response = await fetch(`http://localhost:3000/api/diagnostic/${testSessionId}/question`);
    assert.strictEqual(response.status, 200, `Statut HTTP attendu 200, reçu ${response.status}`);
    const data = await response.json();

    // 4. Vérifier la réponse API
    assert.strictEqual(data.completed, false, "Erreur : La session sans réponse ne doit PAS être 'completed'");
    assert.strictEqual(data.status, 'no_questions_available', "Erreur : Statut attendu 'no_questions_available'");
    assert.strictEqual(data.no_questions, true, "Erreur : Flag no_questions doit être true");

    // 5. Vérifier en base de données que status est 'no_questions_available' et completed_at reste NULL
    const [rows] = await conn.query('SELECT status, completed_at FROM diagnostic_sessions WHERE id = ?', [testSessionId]);
    assert.strictEqual(rows[0].status, 'no_questions_available', "En base, status doit valoir 'no_questions_available'");
    assert.strictEqual(rows[0].completed_at, null, 'En base, completed_at doit rester NULL');

    console.log('✓ Succès : Migration 004 validée ! La session sans question n\'est pas passée à completed.');
  } finally {
    // Nettoyage garanti
    if (testSessionId) {
      await conn.query('DELETE FROM diagnostic_sessions WHERE id = ?', [testSessionId]);
    }
    await conn.query('DELETE FROM symptoms WHERE id = ?', [TEST_SYMPTOM_ID]);
    await conn.end();
  }
}

testAutoCompleteGuard().catch(err => {
  console.error('❌ Échec test Migration 004 :', err.message);
  process.exit(1);
});
