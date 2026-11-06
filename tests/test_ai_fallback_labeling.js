const assert = require('assert');
const { AIFallbackService } = require('../backend/src/diagnostic/ai/aiFallback');
const { MockLLMClient } = require('../backend/src/diagnostic/ai/llmClient');

async function testAiFallbackLabeling() {
  console.log('================================================================');
  console.log('🧪 TEST: ÉTIQUETAGE DU FALLBACK IA (NON VÉRIFIÉ, ZÉRO CODE/SCORE)');
  console.log('================================================================\n');

  console.log('[1/2] Test du fallback avec réponse normale...');
  const normalClient = new MockLLMClient({
    hypotheses: [
      { label: "Capteur de pression atmosphérique", rationale: "Peut expliquer un comportement instable en altitude" }
    ],
    disclaimer: "NON VÉRIFIÉ — consulter un professionnel."
  });

  const fallbackService = new AIFallbackService(normalClient);
  const result = await fallbackService.suggestFallback("La voiture a un comportement bizarre en montagne");

  console.log('  -> Résultat fallback :', result);
  assert.ok(result.disclaimer.includes('NON VÉRIFIÉ'), 'Le disclaimer obligatoire doit être présent');
  assert.strictEqual(result.hypotheses.length, 1);
  assert.strictEqual(result.hypotheses[0].verified, false, 'verified DOIT être strictement false');
  assert.strictEqual(result.hypotheses[0].faultCode, undefined, 'Aucun faultCode ne doit être présent');
  assert.strictEqual(result.hypotheses[0].confidence, undefined, 'Aucune métrique de confiance ne doit être présente');

  console.log('\n[2/2] Test du rejet strict si l\'IA tente de générer un code FAULT-***...');
  const rogueClient = new MockLLMClient({
    hypotheses: [
      { label: "Problème sur FAULT-BAD-001", rationale: "Tentative d'injection de code" }
    ],
    disclaimer: "NON VÉRIFIÉ"
  });

  const rogueService = new AIFallbackService(rogueClient);
  const rogueResult = await rogueService.suggestFallback("test");

  console.log('  -> Résultat neutralisé :', rogueResult);
  // Type guard must reject the rogue item and return a safe unverified fallback
  assert.ok(!JSON.stringify(rogueResult).includes('FAULT-BAD-001'), 'Le code FAULT-BAD-001 doit avoir été éliminé');
  assert.strictEqual(rogueResult.hypotheses[0].verified, false);

  console.log('\n================================================================');
  console.log('🎉 TEST ÉTIQUETAGE FALLBACK IA : SUCCÈS À 100%');
  console.log('================================================================\n');
}

testAiFallbackLabeling()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Échec du test fallback labeling :', err);
    process.exit(1);
  });
