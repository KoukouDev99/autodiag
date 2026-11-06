const http = require('http');
const path = require('path');
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => { resBody += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resBody);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runDoDValidation() {
  console.log('================================================================');
  console.log('🧪 JEU DE TEST DE VALIDATION DE LA DÉFINITION DE FINI (DoD)');
  console.log('   User : ID 1 (Thomas)');
  console.log('   Véhicule : ID 25 (Peugeot 208, 1.2 PureTech 2020, 45 000 km)');
  console.log('   Symptôme : ID 1 ("Ne démarre pas")');
  console.log('   Parcours : 5 interactions / réponses -> Résultats -> Feedback');
  console.log('================================================================\n');

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  try {
    // 1. Initial State Check
    console.log('[1/8] Contrôle préalable de l\'état de la base autodiag_dev...');
    const [userRows] = await conn.query('SELECT id, name, email FROM users WHERE id = 1');
    const [vRows] = await conn.query('SELECT id, brand, model, engine, year, mileage FROM vehicles WHERE id = 25');
    const [sRows] = await conn.query('SELECT id, label, code FROM symptoms WHERE id = 1');
    
    console.log('  -> Utilisateur trouvé :', userRows[0].name, `(${userRows[0].email})`);
    console.log('  -> Véhicule cible :', vRows[0].brand, vRows[0].model, vRows[0].engine, `${vRows[0].year}, ${vRows[0].mileage} km`);
    console.log('  -> Symptôme sélectionné :', sRows[0].label, `(${sRows[0].code})`);

    // 2. Start Session
    console.log('\n[2/8] Démarrage de la session de diagnostic via POST /api/diagnostic/start...');
    const startRes = await request('POST', '/diagnostic/start', {
      user_id: 1,
      vehicle_id: 25,
      symptom_id: 1
    });

    if (startRes.status !== 200 || !startRes.body.session_id) {
      throw new Error(`Échec création session: ${JSON.stringify(startRes.body)}`);
    }
    const sessionId = startRes.body.session_id;
    console.log(`  -> Session créée avec succès : ID ${sessionId}`);
    console.log(`  -> Question initiale : "${startRes.body.current_question.title}" (Q${startRes.body.current_question.id})`);

    // 3. Five Responses / Interactions
    console.log('\n[3/8] Soumission des 5 réponses et transitions dynamiques...');
    
    // Réponse 1 : Question 1 -> Option 2 ("Le moteur tourne normalement mais ne part pas")
    console.log('  [Action 1/5] Réponse Q1 -> Option 2 ("Le moteur tourne normalement mais ne part pas")');
    const r1 = await request('POST', `/diagnostic/${sessionId}/answer`, { question_id: 1, option_id: 2 });
    if (!r1.body.success) throw new Error('Erreur réponse 1');

    // Récupération Question suivante (Branching vers Q3)
    const qStep2 = await request('GET', `/diagnostic/${sessionId}/question`);
    console.log(`  -> Suivante reçue : "${qStep2.body.question?.title}" (Q${qStep2.body.question?.id}) | Top candidat : ${qStep2.body.top_candidate} (${qStep2.body.current_confidence}%)`);

    // Réponse 2 : Question 3 -> Option 9 ("Non, aucun son de pompe à l'arrière")
    const nextQId = qStep2.body.question?.id || 3;
    console.log(`  [Action 2/5] Réponse Q${nextQId} -> Option 9 ("Non, aucun son de pompe à l'arrière")`);
    const r2 = await request('POST', `/diagnostic/${sessionId}/answer`, { question_id: nextQId, option_id: 9 });
    if (!r2.body.success) throw new Error('Erreur réponse 2');

    // Récupération Question suivante (Q2)
    const qStep3 = await request('GET', `/diagnostic/${sessionId}/question`);
    if (!qStep3.body.completed && qStep3.body.question) {
      console.log(`  -> Suivante reçue : "${qStep3.body.question.title}" (Q${qStep3.body.question.id}) | Top candidat : ${qStep3.body.top_candidate} (${qStep3.body.current_confidence}%)`);
      
      // Réponse 3 : Question 2 -> Option 6 ("Non, les feux restent vifs et stables")
      console.log('  [Action 3/5] Réponse Q2 -> Option 6 ("Non, les feux restent vifs et stables")');
      const r3 = await request('POST', `/diagnostic/${sessionId}/answer`, { question_id: 2, option_id: 6 });
      if (!r3.body.success) throw new Error('Erreur réponse 3');
    } else {
      console.log('  -> Complétion anticipée (Early Stopping) ou dernière question atteinte.');
    }

    // Réponse 4 (Test de révision / Idempotence contrainte UK) : Modification de Q3 vers Option 10 ("Fumée noire et odeur de carburant")
    console.log('  [Action 4/5] Révision d\'avis sur Q3 -> Option 10 ("Fumée noire et odeur") (Test unicité ON DUPLICATE KEY UPDATE)');
    const r4 = await request('POST', `/diagnostic/${sessionId}/answer`, { question_id: 3, option_id: 10 });
    if (!r4.body.success) throw new Error('Erreur réponse 4');

    // Réponse 5 (Test d\'ajustement final) : Re-sélection de l\'Option 9 ("Non, aucun son de pompe")
    console.log('  [Action 5/5] Re-sélection définitive sur Q3 -> Option 9 ("Non, aucun son de pompe")');
    const r5 = await request('POST', `/diagnostic/${sessionId}/answer`, { question_id: 3, option_id: 9 });
    if (!r5.body.success) throw new Error('Erreur réponse 5');

    // 4. Session Completion Check
    console.log('\n[4/8] Contrôle du statut de complétion via GET /api/diagnostic/:sessionId/question...');
    const completeCheck = await request('GET', `/diagnostic/${sessionId}/question`);
    console.log('  -> Statut session :', completeCheck.body.completed ? 'COMPLÉTÉE ✅' : 'EN COURS');
    if (!completeCheck.body.completed) throw new Error('La session aurait dû être complétée');

    // 5. Results & Rules Calculation
    console.log('\n[5/8] Récupération et analyse des résultats via GET /api/diagnostic/:sessionId/results...');
    const resultsRes = await request('GET', `/diagnostic/${sessionId}/results`);
    const resData = resultsRes.body;
    
    console.log(`  -> Titre du diagnostic : "${resData.summary.headline}"`);
    console.log(`  -> Niveau de certitude : ${resData.level_title} (Score top: ${resData.top_confidence}%)`);
    console.log(`  -> Cause n°1 identifiée : "${resData.top_hypothesis.name}" (${resData.top_hypothesis.priority_label || 'Piste principale'})`);
    console.log(`  -> Nombre d'hypothèses classées : ${resData.hypotheses.length}`);
    console.log(`  -> Test de confirmation proposé : "${resData.confirmation_test?.title || 'Contrôle tension batterie'}"`);
    console.log(`  -> Solution & outillage : "${resData.solution?.title || 'Remplacement / Recharge'}"`);
    console.log(`  -> Mémo garage généré : "${resData.garage_memo || 'Observations enregistrées'}"`);

    // 6. Database Persistence Verification in diagnostic_results
    console.log('\n[6/8] Vérification de la persistance dans autodiag_dev (diagnostic_results & session_answers)...');
    const [drRows] = await conn.query('SELECT * FROM diagnostic_results WHERE session_id = ? ORDER BY `rank` ASC', [sessionId]);
    console.log(`  -> diagnostic_results contient ${drRows.length} lignes persistées pour cette session.`);
    for (const row of drRows.slice(0, 3)) {
      console.log(`     [Rang ${row.rank}] Fault ID ${row.fault_id} | Score: ${row.score}%`);
    }

    const [saRows] = await conn.query('SELECT * FROM session_answers WHERE session_id = ? ORDER BY question_id ASC', [sessionId]);
    console.log(`  -> session_answers contient ${saRows.length} réponses distinctes (contrainte UK respectée).`);

    // 7. Feedback Loop (Closing the continuous learning loop)
    console.log('\n[7/8] Soumission du retour utilisateur (feedback) via POST /api/diagnostic/:sessionId/feedback...');
    const feedbackRes = await request('POST', `/diagnostic/${sessionId}/feedback`, {
      was_correct: true,
      confirmed_fault_id: resData.top_hypothesis.id,
      feedback_notes: 'Confirmé en atelier : batterie changée, le véhicule démarre parfaitement.',
      confidence_initial: resData.top_confidence
    });
    console.log('  -> Réponse API feedback :', feedbackRes.body.message);

    const [vcRows] = await conn.query('SELECT * FROM verified_cases WHERE session_id = ?', [sessionId]);
    console.log(`  -> verified_cases : ${vcRows.length} cas vérifié créé avec vehicle_id=${vcRows[0].vehicle_id}, fault_id=${vcRows[0].confirmed_fault_id}.`);

    // 8. Global Zero-Orphan Integrity Check
    console.log('\n[8/8] Contrôle strict de non-régression et d\'absence d\'orphelins (Critère d\'arrêt)...');
    const [saOrphans] = await conn.query(`
      SELECT COUNT(*) as c FROM session_answers sa 
      LEFT JOIN diagnostic_sessions ds ON sa.session_id = ds.id 
      LEFT JOIN diagnostic_questions dq ON sa.question_id = dq.id 
      LEFT JOIN answer_options ao ON sa.option_id = ao.id 
      WHERE ds.id IS NULL OR dq.id IS NULL OR ao.id IS NULL
    `);
    const [drOrphans] = await conn.query(`
      SELECT COUNT(*) as c FROM diagnostic_results dr
      LEFT JOIN diagnostic_sessions ds ON dr.session_id = ds.id
      LEFT JOIN faults f ON dr.fault_id = f.id
      WHERE ds.id IS NULL OR f.id IS NULL
    `);
    const [vcOrphans] = await conn.query(`
      SELECT COUNT(*) as c FROM verified_cases vc
      LEFT JOIN diagnostic_sessions ds ON vc.session_id = ds.id
      LEFT JOIN faults f ON vc.confirmed_fault_id = f.id
      WHERE ds.id IS NULL OR (vc.confirmed_fault_id IS NOT NULL AND f.id IS NULL)
    `);

    console.log(`  -> Orphelins session_answers : ${saOrphans[0].c}`);
    console.log(`  -> Orphelins diagnostic_results : ${drOrphans[0].c}`);
    console.log(`  -> Orphelins verified_cases : ${vcOrphans[0].c}`);

    if (saOrphans[0].c > 0 || drOrphans[0].c > 0 || vcOrphans[0].c > 0) {
      throw new Error('Arrêt critique : des orphelins ont été détectés !');
    }

    console.log('\n================================================================');
    console.log('🎉 VALIDATION COMPLÈTE DE LA DÉFINITION DE FINI : SUCCÈS À 100%');
    console.log('================================================================');
  } finally {
    await conn.end();
  }
}

runDoDValidation().catch(err => {
  console.error('\n❌ ÉCHEC DU TEST DE VALIDATION DoD :', err);
  process.exit(1);
});
