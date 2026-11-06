const assert = require('assert');
const { HybridDiagnosticOrchestrator } = require('../backend/src/diagnostic/orchestrator');
const { MockLLMClient } = require('../backend/src/diagnostic/ai/llmClient');

async function testAiDisabledMode() {
  console.log('================================================================');
  console.log('🧪 TEST: MODE AI_ENABLED=FALSE (DB-ONLY PUR, ZÉRO APPEL LLM)');
  console.log('================================================================\n');

  const mockLLM = new MockLLMClient("Réponse IA qui ne doit JAMAIS être appelée");

  const orchestrator = new HybridDiagnosticOrchestrator({
    llmClient: mockLLM,
    aiEnabled: false // Strictly disabled
  });

  console.log('[1/2] Exécution d\'un diagnostic avec IA désactivée...');
  const result = await orchestrator.runDiagnostic({
    userId: 1,
    vehicleId: 25,
    symptomId: 1 // Entrée structurée DB
  });

  console.log('  -> Résultat en mode DB-only :', {
    faultCode: result.faultCode,
    confidence: result.confidence,
    source: result.source,
    needsProfessional: result.needsProfessional
  });

  assert.strictEqual(result.source, 'rules');
  assert.ok(result.faultCode.startsWith('FAULT-'));
  assert.strictEqual(mockLLM.callHistory.length, 0, 'Le client LLM ne doit avoir reçu AUCUN appel');

  console.log('\n[2/2] Vérification qu\'aucun appel IA n\'a eu lieu...');
  assert.strictEqual(mockLLM.callHistory.length, 0);

  console.log('\n================================================================');
  console.log('🎉 TEST MODE AI_ENABLED=FALSE : SUCCÈS À 100%');
  console.log('================================================================\n');
}

testAiDisabledMode()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Échec du test mode AI_ENABLED=false :', err);
    process.exit(1);
  });
