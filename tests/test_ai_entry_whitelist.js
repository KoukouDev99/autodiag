const assert = require('assert');
const { AIEntryService } = require('../backend/src/diagnostic/ai/aiEntry');
const { MockLLMClient } = require('../backend/src/diagnostic/ai/llmClient');

async function testAiEntryWhitelist() {
  console.log('================================================================');
  console.log('🧪 TEST: WHITELIST ET REJET DES SYMPTÔMES INVENTÉS PAR L\'IA');
  console.log('================================================================\n');

  const validSymptoms = [
    { id: 1, code: 'start_fail', label: 'Ne démarre pas' },
    { id: 2, code: 'power_loss', label: 'Perte de puissance' }
  ];

  // 1. LLM returns a hallucinated ID (e.g. 9999 or "symptom_imaginaire")
  console.log('[1/2] Test avec une IA qui renvoie un ID 9999 inexistant...');
  const hallucinatingClient = new MockLLMClient({
    symptomId: 9999,
    confidence: 0.95
  });

  const aiEntryService = new AIEntryService(hallucinatingClient);
  const resultHallucination = await aiEntryService.normalizeSymptom("Bruit bizarre", validSymptoms);

  console.log('  -> Résultat validé :', resultHallucination);
  assert.strictEqual(resultHallucination.symptomId, null, 'Un ID non présent dans la whitelist DOIT être neutralisé à null');
  assert.strictEqual(resultHallucination.confidence, 0, 'La confiance d\'un ID non présent doit être forcée à 0');

  // 2. LLM returns a valid ID (1)
  console.log('\n[2/2] Test avec une IA qui renvoie un ID valide (1)...');
  const validClient = new MockLLMClient({
    symptomId: 1,
    confidence: 0.88
  });

  const validService = new AIEntryService(validClient);
  const resultValid = await validService.normalizeSymptom("La voiture refuse de démarrer", validSymptoms);

  console.log('  -> Résultat validé :', resultValid);
  assert.strictEqual(resultValid.symptomId, 1, 'Un ID valide doit être conservé');
  assert.strictEqual(resultValid.confidence, 0.88);

  console.log('\n================================================================');
  console.log('🎉 TEST WHITELIST ENTRÉE IA : SUCCÈS À 100%');
  console.log('================================================================\n');
}

testAiEntryWhitelist()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Échec du test whitelist entrée :', err);
    process.exit(1);
  });
