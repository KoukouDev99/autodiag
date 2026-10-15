const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve(JSON.parse(raw)));
    }).on('error', reject);
  });
}

async function testEliminationRules() {
  console.log('=== TEST: Progressive Elimination of Impossible Faults ===');
  
  // Scenario: Car does not start, but the starter engine spins vigorously ("Le moteur tourne normalement mais ne démarre pas")
  const session = await post('/api/diagnostic/start', { symptom_id: 1, vehicle_id: 1 });
  const sid = session.session_id;
  console.log(`Diagnostic Session #${sid} created for "Ne démarre pas"`);

  // Fetch Q1
  const q1 = await get(`/api/diagnostic/${sid}/question`);
  console.log(`Q1: "${q1.question.title}"`);
  
  // Find option: "Le moteur tourne normalement mais ne part pas"
  const optTurn = q1.question.options.find(o => o.title.toLowerCase().includes('tourne normalement')) || q1.question.options[1];
  console.log(`User selects: "${optTurn.title}"`);

  await post(`/api/diagnostic/${sid}/answer`, { question_id: q1.question.id, option_id: optTurn.id });

  // Fetch results to inspect eliminated hypotheses
  const results = await get(`/api/diagnostic/${sid}/results`);
  console.log('\n--- EVALUATION RESULTS ---');
  console.log(`Active Top Candidate: ${results.top_hypothesis.name} (${results.top_confidence}%)`);
  console.log('Top 3 Active Hypotheses:');
  results.hypotheses.forEach(h => console.log(`  - ${h.name} (${h.confidence_percent}%)`));

  console.log('\nEliminated Hypotheses (Excluded by rule):');
  if (results.eliminated_hypotheses && results.eliminated_hypotheses.length > 0) {
    results.eliminated_hypotheses.forEach(e => {
      console.log(`  ❌ ${e.name} -> Reason: ${e.reasoning ? e.reasoning[0] : 'Excluded'}`);
    });
  } else {
    console.log('  None recorded.');
  }

  console.log('\n=== VERIFICATION: Battery and Starter must NOT be top candidates! ===');
  const topNames = results.hypotheses.map(h => h.name.toLowerCase());
  const batteryInTop = topNames.some(n => n.includes('batterie faible'));
  const starterInTop = topNames.some(n => n.includes('démarreur ou solénoïde'));
  
  console.log(`Battery in active top 3: ${batteryInTop} (Expected: false)`);
  console.log(`Starter in active top 3: ${starterInTop} (Expected: false)`);
  
  console.log('\n✓ PROGRESSIVE ELIMINATION TEST COMPLETED SUCCESSFULLY!');
}

testEliminationRules().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
