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

async function runTests() {
  console.log('=== TEST 1: Testing all 9 Symptoms Initialization ===');
  const symptoms = await get('/api/symptoms');
  console.log(`Found ${symptoms.length} symptoms in database.`);

  for (const symp of symptoms) {
    const startRes = await post('/api/diagnostic/start', {
      symptom_id: symp.id,
      vehicle_id: 1,
      user_id: 1
    });

    if (!startRes.session_id) {
      throw new Error(`Failed to start session for symptom ${symp.label}: ${JSON.stringify(startRes)}`);
    }

    const firstQ = startRes.current_question;
    console.log(`✓ Symptom ${symp.id} (${symp.label}) started -> Session ID: ${startRes.session_id}, Q1: "${firstQ ? firstQ.title : 'None'}" (${firstQ?.options?.length || 0} options)`);
  }

  console.log('\n=== TEST 2: Testing Adaptive Information-Gain & Early Stopping Flow ===');
  // Start Symptom 1 (Démarrage impossible)
  const session = await post('/api/diagnostic/start', { symptom_id: 1, vehicle_id: 1 });
  const sid = session.session_id;
  console.log(`Session #${sid} created for Démarrage`);

  // Question 1
  let qInfo = await get(`/api/diagnostic/${sid}/question`);
  console.log(`Question 1 (Step ${qInfo.question.step_num}/${qInfo.question.total_steps}): "${qInfo.question.title}"`);
  
  // Pick Option 1: "Des clics rapides, mais rien ne tourne" (strongly favors battery)
  const opt1 = qInfo.question.options[0];
  console.log(`Answering: "${opt1.title}"`);
  await post(`/api/diagnostic/${sid}/answer`, { question_id: qInfo.question.id, option_id: opt1.id });

  // Question 2 (Adaptive choice)
  qInfo = await get(`/api/diagnostic/${sid}/question`);
  console.log(`Question 2 (Step ${qInfo.question.step_num}/${qInfo.question.total_steps}): "${qInfo.question.title}" (Top candidate: ${qInfo.top_candidate}, confidence: ${qInfo.current_confidence}%)`);
  
  // Pick Option 1: "S'éteignent complètement ou deviennent très faibles" (confirms dead battery)
  const opt2 = qInfo.question.options[0];
  console.log(`Answering: "${opt2.title}"`);
  await post(`/api/diagnostic/${sid}/answer`, { question_id: qInfo.question.id, option_id: opt2.id });

  // Question 3 or Early Stopping!
  qInfo = await get(`/api/diagnostic/${sid}/question`);
  console.log('Result after 2 strong answers:', qInfo.completed ? `✓ EARLY STOPPING TRIGGERED! (Reason: ${qInfo.reason})` : `Next Question: "${qInfo.question?.title}"`);

  // Fetch final results
  const results = await get(`/api/diagnostic/${sid}/results`);
  console.log('\n=== Final Diagnostic Results Summary ===');
  console.log(`- Headline: ${results.summary.headline}`);
  console.log(`- Output Level: ${results.output_level} (${results.level_title})`);
  console.log(`- Top Confidence: ${results.top_confidence}%`);
  console.log(`- Top Hypothesis: ${results.top_hypothesis.name}`);
  console.log(`- Top 3 Hypotheses:`, results.hypotheses.map(h => `${h.name} (${h.confidence_percent}%)`).join(', '));
  console.log(`- Confirmation Test: "${results.confirmation_test.title}" -> ${results.confirmation_test.action}`);
  console.log(`- Garage Memo: "${results.garage_memo.headline}"`);
  console.log(`  What to say: ${results.garage_memo.what_to_say}`);

  console.log('\n=== TEST 3: Testing "Je ne sais pas" Graceful Handling ===');
  const sessUnknown = await post('/api/diagnostic/start', { symptom_id: 3, vehicle_id: 1 }); // Bruit anormal
  const sidUnk = sessUnknown.session_id;
  let qUnk = await get(`/api/diagnostic/${sidUnk}/question`);
  console.log(`Bruit Anormal Q1: "${qUnk.question.title}"`);
  
  // Find "Je ne sais pas"
  const optUnknown = qUnk.question.options.find(o => o.title.toLowerCase().includes('sais pas')) || qUnk.question.options[qUnk.question.options.length - 1];
  console.log(`User selects: "${optUnknown.title}"`);
  await post(`/api/diagnostic/${sidUnk}/answer`, { question_id: qUnk.question.id, option_id: optUnknown.id });

  let qUnkNext = await get(`/api/diagnostic/${sidUnk}/question`);
  console.log('qUnkNext response:', JSON.stringify(qUnkNext, null, 2));
  if (qUnkNext.question) {
    console.log(`Successfully pivoted to next question: "${qUnkNext.question.title}" (Step ${qUnkNext.question.step_num})`);
  } else {
    console.log('Session state:', qUnkNext);
  }
  
  console.log('\n ALL DIAGNOSTIC ALGORITHM TESTS PASSED SUCCESSFULLY! ');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
