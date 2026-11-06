/**
 * AI Explain Module: Result Explanation & Vulgarization
 * 
 * Generates an empathetic, beginner-friendly explanation of deterministic engine results.
 * Safety guard: Strictly forbids inventing any new fault codes (FAULT-***-***)
 * not present in the allowed candidates whitelist.
 */

const { validateIAExplainOutput } = require('../contracts');
const { logAiAudit, createLLMClient } = require('./llmClient');

class AIExplainService {
  /**
   * @param {import('./llmClient').ILLMClient} [llmClient]
   */
  constructor(llmClient = null) {
    this.llmClient = llmClient || createLLMClient();
  }

  /**
   * Explains diagnostic engine results to the driver.
   * @param {Object} rulesResult Output from DiagnosticEngine.evaluate
   * @param {string} [locale='fr']
   * @param {number|null} [sessionId=null]
   * @returns {Promise<import('../contracts').IAExplainOutput>}
   */
  async explainResult(rulesResult, locale = 'fr', sessionId = null) {
    if (!rulesResult) {
      return { text: 'Aucun résultat de diagnostic disponible à expliquer.' };
    }

    const topHypo = rulesResult.top_hypothesis;
    const candidates = rulesResult.candidates || (rulesResult.hypotheses || []).map(h => ({
      faultCode: h.code || h.fault_code || `FAULT-${h.id}`,
      name: h.name,
      confidence: h.confidence_percent || 0
    }));

    const allowedFaultCodes = candidates.map(c => c.faultCode);
    const candidateListPrompt = candidates
      .map(c => `- ${c.name} (${c.faultCode}) : certitude ${c.confidence}%`)
      .join('\n');

    const prompt = `Tu es un conseiller mécanique bienveillant pour particuliers.
Le moteur d'expertise déterministe a analysé le véhicule et a produit le classement ci-dessous.
Ta tâche est de vulgariser ce diagnostic sans jargon technique, en 3 ou 4 phrases claires.

RÉSULTAT OFFICIEL DU MOTEUR TECHNIQUE :
- Panne principale retenue : ${topHypo ? topHypo.name : 'Indéterminée'}
- Pistes candidates autorisées :
${candidateListPrompt}
- Observations : ${(rulesResult.observations || []).join(', ') || 'Symptômes signalés'}

RÈGLES DE SÉCURITÉ ABSOLUES :
1. Rédige en français accessible pour un automobiliste non mécanicien.
2. Tu ne dois JAMAIS modifier le diagnostic ni inventer de cause non listée.
3. Il est STRICTEMENT INTERDIT de mentionner un code de panne sous la forme FAULT-*** autre que ceux de la liste autorisée ci-dessus (${allowedFaultCodes.join(', ')}).
4. Précise ce que le conducteur doit vérifier sans danger et ce qu'il doit dire à son garagiste.`;

    const startTime = Date.now();
    let rawResponse = '';

    try {
      rawResponse = await this.llmClient.complete(prompt, { temperature: 0.3, timeoutMs: 3000 });
      const latencyMs = Date.now() - startTime;

      // Clean markdown quotes if any
      const cleanedText = rawResponse.trim();

      // Enforce anti-hallucination type guard
      const validated = validateIAExplainOutput({ text: cleanedText }, allowedFaultCodes);

      logAiAudit({
        sessionId,
        module: 'explain',
        prompt,
        response: rawResponse,
        latencyMs
      });

      return validated;
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      logAiAudit({
        sessionId,
        module: 'explain',
        prompt,
        response: `ERROR: ${err.message}`,
        latencyMs
      });

      // Safe fallback to deterministic summary text
      const fallbackText = topHypo
        ? `L'analyse technique identifie en priorité : ${topHypo.name}. Nous vous recommandons de faire contrôler ce point lors de votre prochaine visite en atelier.`
        : 'Diagnostic à approfondir avec un professionnel de l\'automobile.';

      return { text: fallbackText };
    }
  }
}

module.exports = {
  AIExplainService
};
