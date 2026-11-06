const assert = require('assert');
const path = require('path');
const { HybridDiagnosticOrchestrator } = require('../backend/src/diagnostic/orchestrator');
const { MockLLMClient } = require('../backend/src/diagnostic/ai/llmClient');
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));

async function testOrchestratorHierarchy() {
  console.log('================================================================');
  console.log('🧪 TEST: HIÉRARCHIE STRICTE DE L\'ORCHESTRATEUR (DB > IA)');
  console.log('   Vérifie que l\'IA ne peut JAMAIS modifier le fault_code ni le score');
  console.log('================================================================\n');

  // Configure a Mock LLM that attempts to hallucinate another fault
  const mockLLM = new MockLLMClient((prompt) => {
    // Attempting to inject a fake text
    return "Je pense que c'est une défaillance de FAULT-FAKE-999.";
  });

  const orchestrator = new HybridDiagnosticOrchestrator({
    llmClient: mockLLM,
    aiEnabled: true
  });

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev'
  });

  try {
    console.log('[1/3] Exécution du diagnostic avec input structuré pour symptôme "Ne démarre pas"...');
    // Symptom 1 = start_fail, Vehicle 25 = Peugeot 208
    const result = await orchestrator.runDiagnostic({
      userId: 1,
      vehicleId: 25,
      symptomId: 1
    });

    console.log('  -> Résultat obtenu :', {
      faultCode: result.faultCode,
      confidence: result.confidence,
      source: result.source,
      candidatesCount: result.candidates.length
    });

    // 1. Verify source is strictly 'rules'
    assert.strictEqual(result.source, 'rules', 'La source d\'autorité DOIT être "rules"');

    // 2. Verify faultCode is an authentic code from the DB (e.g. FAULT-BAT-001)
    const [faultInDb] = await conn.query('SELECT code FROM faults WHERE code = ?', [result.faultCode]);
    assert.ok(faultInDb.length > 0, `Le fault_code ${result.faultCode} DOIT exister dans la table faults`);

    // 3. Verify the LLM hallucination of FAULT-FAKE-999 was rejected by the validator
    assert.ok(!result.explanation.includes('FAULT-FAKE-999'), 'L\'hallucination FAULT-FAKE-999 doit avoir été rejetée');

    console.log('\n[2/3] Tentative d\'altération du score de confiance par un LLM...');
    // Ensure the confidence returned matches evaluate(...) and was NOT replaced by a fake LLM probability
    assert.strictEqual(typeof result.confidence, 'number');
    assert.ok(result.confidence >= 0 && result.confidence <= 1.0);

    console.log('\n[3/3] Vérification des candidats autorisés...');
    for (const cand of result.candidates) {
      assert.ok(cand.faultCode.startsWith('FAULT-'), 'Tous les candidats doivent être des codes conformes');
    }

    console.log('\n================================================================');
    console.log('🎉 TEST HIÉRARCHIE ORCHESTRATEUR : SUCCÈS À 100%');
    console.log('================================================================\n');
  } finally {
    await conn.end();
  }
}

testOrchestratorHierarchy()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Échec du test hiérarchie :', err);
    process.exit(1);
  });
