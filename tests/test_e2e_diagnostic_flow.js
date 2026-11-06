/**
 * Test E2E - Parcours complet de diagnostic sur le moteur unifié
 * Vérifie :
 * 1. Démarrage de session pour un symptôme unifié (ex: symptôme 1 "Ne démarre pas")
 * 2. Récupération de la première question depuis diagnostic_questions
 * 3. Enregistrement d'une réponse dans session_answers
 * 4. Progression du diagnostic et arrêt anticipé ou complétion
 * 5. Nettoyage de la session de test
 */
const mysql = require('c:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto/backend/node_modules/mysql2/promise');
const assert = require('assert');

async function testE2EDiagnostic() {
  console.log('🧪 Test E2E : Validation du cycle complet de diagnostic...');

  // 1. Démarrer une session via l'API
  const startRes = await fetch('http://localhost:3000/api/diagnostic/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicle_id: 25,
      symptom_id: 1,
      user_id: 1
    })
  });

  assert.strictEqual(startRes.status, 200, `Erreur start session : HTTP ${startRes.status}`);
  const startData = await startRes.json();
  const sessionId = startData.session_id || startData.id;
  console.log(`  -> Session créée : ID ${sessionId}`);

  try {
    // 2. Récupérer la première question
    const qRes = await fetch(`http://localhost:3000/api/diagnostic/${sessionId}/question`);
    assert.strictEqual(qRes.status, 200, `Erreur fetch question : HTTP ${qRes.status}`);
    const qData = await qRes.json();

    assert.strictEqual(qData.completed, false, 'La session ne doit pas être complétée à l\'étape 1');
    assert.ok(qData.question, 'Une question doit être retournée');
    assert.ok(qData.question.options.length > 0, 'La question doit comporter des options de réponse');
    console.log(`  -> Question 1 reçue : "${qData.question.title}" (${qData.question.options.length} options)`);

    const selectedOption = qData.question.options[0];
    console.log(`  -> Réponse sélectionnée : "${selectedOption.label || selectedOption.title}" (ID ${selectedOption.id})`);

    // 3. Soumettre la réponse
    const ansRes = await fetch(`http://localhost:3000/api/diagnostic/${sessionId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question_id: qData.question.id,
        option_id: selectedOption.id
      })
    });
    assert.strictEqual(ansRes.status, 200, `Erreur answer : HTTP ${ansRes.status}`);
    const ansData = await ansRes.json();
    console.log('  -> Réponse enregistrée avec succès.');

    // 4. Récupérer la question suivante ou le statut
    const nextQRes = await fetch(`http://localhost:3000/api/diagnostic/${sessionId}/question`);
    assert.strictEqual(nextQRes.status, 200);
    const nextQData = await nextQRes.json();
    console.log(`  -> Étape suivante : ${nextQData.completed ? 'Diagnostic terminé' : 'Question suivante reçue'}`);

    // 5. Récupérer les résultats du diagnostic et valider la table diagnostic_results
    const resultsRes = await fetch(`http://localhost:3000/api/diagnostic/${sessionId}/results`);
    assert.strictEqual(resultsRes.status, 200, `Erreur results : HTTP ${resultsRes.status}`);
    const resultsData = await resultsRes.json();
    assert.ok(resultsData.top_hypothesis, 'Une hypothèse principale doit être identifiée');
    console.log(`  -> Résultats calculés : Cause principale "${resultsData.top_hypothesis.name}" (Score ${resultsData.top_confidence}%)`);

    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'autodiag_dev'
    });

    const [drRows] = await conn.query('SELECT * FROM diagnostic_results WHERE session_id = ? ORDER BY `rank` ASC', [sessionId]);
    assert.ok(drRows.length > 0, 'La table diagnostic_results doit contenir les résultats persistés');
    assert.strictEqual(drRows[0].rank, 1, 'Le premier résultat doit avoir le rang 1');
    assert.strictEqual(drRows[0].fault_id, resultsData.top_hypothesis.id, 'Le fault_id doit correspondre à la top_hypothesis');
    console.log(`  -> diagnostic_results vérifié : ${drRows.length} hypothèses persistées (Rang 1: fault_id ${drRows[0].fault_id}, score ${drRows[0].score})`);

    // 6. Test de suppression en cascade
    await conn.query('DELETE FROM diagnostic_sessions WHERE id = ?', [sessionId]);
    const [saAfterCascade] = await conn.query('SELECT COUNT(*) as count FROM session_answers WHERE session_id = ?', [sessionId]);
    const [drAfterCascade] = await conn.query('SELECT COUNT(*) as count FROM diagnostic_results WHERE session_id = ?', [sessionId]);
    assert.strictEqual(saAfterCascade[0].count, 0, 'session_answers doit être nettoyé en cascade');
    assert.strictEqual(drAfterCascade[0].count, 0, 'diagnostic_results doit être nettoyé en cascade');
    console.log('  -> Suppression en cascade ON DELETE CASCADE vérifiée avec succès.');

    await conn.end();

    console.log('✓ Succès : Parcours diagnostic E2E entièrement fonctionnel sur le moteur unifié !');
  } finally {
    // Nettoyage de sécurité si le test a échoué avant la suppression
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'autodiag_dev'
    });
    await conn.query('DELETE FROM diagnostic_sessions WHERE id = ?', [sessionId]);
    await conn.end();
  }
}

testE2EDiagnostic().catch(err => {
  console.error('❌ Échec test E2E :', err);
  process.exit(1);
});
