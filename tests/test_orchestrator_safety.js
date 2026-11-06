const assert = require('assert');
const { HybridDiagnosticOrchestrator } = require('../backend/src/diagnostic/orchestrator');
const { MockLLMClient } = require('../backend/src/diagnostic/ai/llmClient');

async function testOrchestratorSafety() {
  console.log('================================================================');
  console.log('🧪 TEST: RÈGLES DE SÉCURITÉ PRIORITAIRES (HARD STOP)');
  console.log('   Vérifie que l\'IA ne peut adoucir aucune alerte critique');
  console.log('================================================================\n');

  // A malicious or hallucinating LLM that attempts to say "C'est sans danger, roulez tranquille"
  const softeningLLM = new MockLLMClient("Pas de panique, le freinage est juste un peu souple, vous pouvez rouler sans risque.");

  const orchestrator = new HybridDiagnosticOrchestrator({
    llmClient: softeningLLM,
    aiEnabled: true
  });

  console.log('[1/2] Test du déclenchement sur défaillance de freinage ("pédale molle")...');
  const resultBrakes = await orchestrator.runDiagnostic({
    userId: 1,
    vehicleId: 25,
    symptomText: "Ma pédale de frein est molle et va jusqu'au plancher"
  });

  console.log('  -> Résultat sécurité :', {
    safetyAlert: resultBrakes.safetyAlert,
    reason: resultBrakes.reason,
    needsProfessional: resultBrakes.needsProfessional,
    explanation: resultBrakes.explanation
  });

  assert.strictEqual(resultBrakes.safetyAlert, true, 'safetyAlert DOIT valoir true');
  assert.strictEqual(resultBrakes.needsProfessional, true, 'needsProfessional DOIT valoir true');
  assert.strictEqual(resultBrakes.reason, 'safety_stop_triggered');
  assert.strictEqual(resultBrakes.source, 'rules', 'La décision de sécurité provient des règles (rules)');
  assert.ok(!resultBrakes.explanation.includes('rouler sans risque'), 'L\'adoucissement IA doit être bloqué');

  console.log('\n[2/2] Test du déclenchement sur fuite d\'essence...');
  const resultFuel = await orchestrator.runDiagnostic({
    userId: 1,
    vehicleId: 25,
    symptomText: "Forte odeur essence sous le capot et fuite carburant"
  });

  assert.strictEqual(resultFuel.safetyAlert, true);
  assert.strictEqual(resultFuel.needsProfessional, true);
  assert.ok(resultFuel.explanation.includes('INCENDIE') || resultFuel.explanation.includes('carburant'));

  console.log('\n================================================================');
  console.log('🎉 TEST RÈGLES DE SÉCURITÉ : SUCCÈS À 100%');
  console.log('================================================================\n');
}

testOrchestratorSafety()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Échec du test sécurité :', err);
    process.exit(1);
  });
