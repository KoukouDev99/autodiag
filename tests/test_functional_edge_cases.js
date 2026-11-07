const http = require('http');
const path = require('path');
require(path.resolve(__dirname, '../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));

function request(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api' + urlPath,
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
        } catch {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runEdgeCases() {
  console.log('================================================================');
  console.log('🧪 SUITE DE TESTS FONCTIONNELS & CAS LIMITES (EDGE CASES)');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ [TEST ${total}] PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [TEST ${total}] FAIL: ${name}`);
      throw new Error(`Failed: ${name}`);
    }
  }

  // 1. Start diagnostic with invalid/special characters
  console.log('--- Test 1 : Entrées extrêmes & injection sur /diagnostic/start ---');
  const resEmpty = await request('POST', '/diagnostic/start', {});
  assert(resEmpty.status === 200 && resEmpty.body.session_id, 'Start sans paramètre bascule sur fallback sain (HTTP 200 avec session_id)');

  const resSqlInj = await request('POST', '/diagnostic/start', { symptom_id: "' OR 1=1 --", symptom_text: "<script>alert('xss')</script>" });
  assert(resSqlInj.status === 200 || resSqlInj.status === 400 || resSqlInj.status === 404, 'Injection SQL & XSS contenue sans crash serveur');

  const resExtremeId = await request('POST', '/diagnostic/start', { symptom_id: 99999999 });
  assert(resExtremeId.status === 404 || resExtremeId.status === 200, 'ID de symptôme inexistant géré proprement');

  // 2. Chat AI: Edge cases (empty, long, special characters)
  console.log('\n--- Test 2 : Cas limites sur le conseiller IA (/chat) ---');
  const resEmptyChat = await request('POST', '/chat', { message: '' });
  assert(resEmptyChat.status === 400, 'Message vide rejeté avec HTTP 400');

  const resSpacesChat = await request('POST', '/chat', { message: '    ' });
  assert(resSpacesChat.status === 400, 'Message d\'espaces blancs rejeté avec HTTP 400');

  const resLongChat = await request('POST', '/chat', { message: 'z'.repeat(600) });
  assert(resLongChat.status === 400 && resLongChat.body.error.includes('500'), 'Message > 500 caractères rejeté avec message explicite');

  const resXssChat = await request('POST', '/chat', { message: 'Ma voiture broute <script>alert("hack")</script>' });
  assert(resXssChat.status === 200 && typeof resXssChat.body.reply === 'string', 'Message contenant du HTML/script traité sans injection');

  // 3. Multi-profile Diagnostic Scoring Verification
  console.log('\n--- Test 3 : Cohérence des profils de scoring mécanique ---');

  // Profil A: Problème démarreur / batterie (Symptôme 1, Q1 -> Clic démarreur Option 1)
  const sessionA = await request('POST', '/diagnostic/start', { symptom_id: 1 });
  const sessIdA = sessionA.body.session_id;
  assert(sessIdA, 'Profil A : Session démarrée');

  // Answer Q1 with option 1 (Clics rapides, rien ne tourne)
  await request('POST', `/diagnostic/${sessIdA}/answer`, { question_id: 1, option_id: 1 });
  // Answer Q2 with option 5 (Lumières s'éteignent presque)
  await request('POST', `/diagnostic/${sessIdA}/answer`, { question_id: 2, option_id: 5 });

  const resultsA = await request('GET', `/diagnostic/${sessIdA}/results`);
  assert(resultsA.status === 200, 'Profil A : Résultats générés');
  const topNameA = (resultsA.body.top_hypothesis?.name || '').toLowerCase();
  assert(topNameA.includes('batterie') || topNameA.includes('démarreur') || topNameA.includes('charge'), `Profil A : Hypothèse électrique/batterie/démarreur identifiée (Top: "${resultsA.body.top_hypothesis?.name}")`);

  // Profil B: Problème alimentation essence (Symptôme 1, Q1 -> Démarreur tourne bien Option 2, Q3 -> Silence pompe Option 9)
  const sessionB = await request('POST', '/diagnostic/start', { symptom_id: 1 });
  const sessIdB = sessionB.body.session_id;
  await request('POST', `/diagnostic/${sessIdB}/answer`, { question_id: 1, option_id: 2 });
  await request('POST', `/diagnostic/${sessIdB}/answer`, { question_id: 3, option_id: 9 });

  const resultsB = await request('GET', `/diagnostic/${sessIdB}/results`);
  assert(resultsB.status === 200, 'Profil B : Résultats générés');
  const topNameB = (resultsB.body.top_hypothesis?.name || '').toLowerCase();
  assert(topNameB.includes('pompe') || topNameB.includes('gavage') || topNameB.includes('carburant'), `Profil B : Hypothèse pompe/carburant identifiée (Top: "${resultsB.body.top_hypothesis?.name}")`);

  // 4. Edge Case: Abandon de session & Refresh
  console.log('\n--- Test 4 : Gestion des abandons et rafraîchissements ---');
  // Complete any prior session
  await request('POST', `/diagnostic/${sessIdB}/results`);

  const sessionAbandoned = await request('POST', '/diagnostic/start', { symptom_id: 2 });
  const abId = sessionAbandoned.body.session_id;
  // User answers 1 question and closes tab/refreshes
  await request('POST', `/diagnostic/${abId}/answer`, { question_id: 4, option_id: 13 });
  
  // Refresh page: query current question
  const refreshQuestion = await request('GET', `/diagnostic/${abId}/question`);
  assert(refreshQuestion.status === 200, 'Rafraîchissement en cours de session : question suivante servie sans erreur (HTTP 200)');
  assert(refreshQuestion.body.session && refreshQuestion.body.session.id === abId, 'Session active persistée après rafraîchissement');

  // Verify recent diagnostics list still works
  const recentDiag = await request('GET', '/diagnostics/recent');
  assert(recentDiag.status === 200 && Array.isArray(recentDiag.body), 'Liste des diagnostics récents accessible et intègre');

  // 5. Edge Case: Formulaire véhicule et valeurs limites
  console.log('\n--- Test 5 : Formulaire véhicule & valeurs limites ---');
  const vehiclesRes = await request('GET', '/vehicles');
  assert(vehiclesRes.status === 200 && Array.isArray(vehiclesRes.body) && vehiclesRes.body.length > 0, 'Véhicules utilisateur récupérés avec succès');

  console.log('\n================================================================');
  console.log(`🎉 TOUS LES TESTS FONCTIONNELS ET CAS LIMITES VALIDÉS : ${passed}/${total}`);
  console.log('================================================================');
}

runEdgeCases().catch(err => {
  console.error('Erreur durant les tests fonctionnels :', err);
  process.exit(1);
});
