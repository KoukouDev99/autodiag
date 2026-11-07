/**
 * Smoke Tests Suite - AutoDiag Pre-Production Audit
 * Valide en direct tous les endpoints API critiques, les en-têtes de sécurité,
 * et la résilience du backend Express.
 */

const http = require('http');

let passCount = 0;
let failCount = 0;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function assertTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name} : ${err.message}`);
    failCount++;
  }
}

async function runSmokeTests() {
  console.log('================================================================');
  console.log('🚀 AUTO-DIAG SMOKE TESTS SUITE (PRODUCTION READINESS)');
  console.log('================================================================\n');

  // 1. Health check & Security headers
  await assertTest('GET /api/health renvoie status: ok et en-têtes de sécurité Helmet', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (res.body.status !== 'ok') throw new Error(`Health status ${res.body.status} != ok`);
    if (!res.headers['content-security-policy']) throw new Error('CSP manquant');
    if (res.headers['x-content-type-options'] !== 'nosniff') throw new Error('X-Content-Type-Options manquant');
    if (res.headers['x-frame-options'] !== 'SAMEORIGIN') throw new Error('X-Frame-Options manquant');
  });

  // 2. Symptoms catalog
  await assertTest('GET /api/symptoms renvoie la liste complète des symptômes', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/symptoms',
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!Array.isArray(res.body) || res.body.length === 0) throw new Error('Liste symptômes vide');
  });

  // 3. Vehicles catalog makes
  await assertTest('GET /api/catalog/makes renvoie les marques automobiles', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/catalog/makes',
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!Array.isArray(res.body) || res.body.length === 0) throw new Error('Marques introuvables');
  });

  // 4. Vehicles
  await assertTest('GET /api/vehicles renvoie les véhicules configurés', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/vehicles',
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!Array.isArray(res.body)) throw new Error('Format de réponse invalide');
  });

  // 5. OBD PIDs & DTC
  await assertTest('GET /api/pids renvoie le catalogue OBD-II PIDs', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/pids',
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
  });

  await assertTest('GET /api/dtc/P0300 renvoie la fiche technique du code raté d\'allumage', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/dtc/P0300',
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!res.body.code || res.body.code !== 'P0300') throw new Error('DTC P0300 non trouvé');
  });

  // 6. Diagnostic Start
  let sessionId = null;
  await assertTest('POST /api/diagnostic/start initialise une session valide', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/diagnostic/start',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      userId: 1,
      vehicleId: 25,
      symptomId: 1
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!res.body.session_id) throw new Error('Aucun session_id renvoyé');
    sessionId = res.body.session_id;
  });

  // 7. Get Diagnostic Question
  await assertTest('GET /api/diagnostic/:sessionId/question renvoie la question courante', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/diagnostic/${sessionId}/question`,
      method: 'GET'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!res.body.question && res.body.status !== 'completed') throw new Error('Ni question ni status completed');
  });

  // 8. AI Chat Assistant - Message Nominal
  await assertTest('POST /api/chat répond avec un message structuré', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      message: 'Ma Peugeot 208 cale au ralenti, que vérifier ?',
      vehicleContext: { brand: 'Peugeot', model: '208', year: 2020 }
    });
    if (res.status !== 200) throw new Error(`Status ${res.status} != 200`);
    if (!res.body.reply) throw new Error('Champ reply absent');
  });

  // 9. AI Chat Assistant - Sécurité message trop long (>500 caractères)
  await assertTest('POST /api/chat bloque les messages abusifs > 500 chars (HTTP 400)', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/chat',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      message: 'x'.repeat(501)
    });
    if (res.status !== 400) throw new Error(`Status ${res.status} != 400`);
  });

  // 10. Route inconnue 404
  await assertTest('GET /api/route-inexistante renvoie HTTP 404 sans fuite d\'erreur', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/route-inexistante',
      method: 'GET'
    });
    if (res.status !== 404) throw new Error(`Status ${res.status} != 404`);
  });

  console.log('\n================================================================');
  console.log(`📊 BILAN DES TESTS : ${passCount} réussis, ${failCount} échoués`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runSmokeTests().catch(err => {
  console.error('Erreur fatale lors des smoke tests :', err);
  process.exit(1);
});
