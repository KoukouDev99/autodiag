/**
 * AI Entry Module: Symptom Normalization
 * 
 * Maps free-form user problem description to a canonical database symptom_id.
 * Safety guard: Rejects any hallucinated symptom ID not in the database whitelist.
 */

const { validateIAEntryOutput } = require('../contracts');
const { logAiAudit, createLLMClient } = require('./llmClient');

class AIEntryService {
  /**
   * @param {import('./llmClient').ILLMClient} [llmClient]
   */
  constructor(llmClient = null) {
    this.llmClient = llmClient || createLLMClient();
  }

  /**
   * Normalizes free text to a valid database symptom ID.
   * @param {string} text User's natural language input
   * @param {Array<{id: number|string, code: string, label: string}>} validSymptoms DB symptoms whitelist
   * @param {number|null} [sessionId=null]
   * @returns {Promise<import('../contracts').IAEntryOutput>}
   */
  async normalizeSymptom(text, validSymptoms = [], sessionId = null) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return { symptomId: null, confidence: 0, raw: text || '' };
    }

    const validIds = validSymptoms.map(s => s.id);
    const validCodes = validSymptoms.map(s => s.code);
    const symptomsCatalogPrompt = validSymptoms
      .map(s => `- ID: ${s.id} | Code: "${s.code}" | Description: "${s.label}"`)
      .join('\n');

    const prompt = `Tu es un classificateur déterministe d'assistance mécanique automobile.
Ta tâche est de faire correspondre la description de panne d'un automobiliste à EXACTEMENT UN des symptômes canoniques ci-dessous.

CATALOGUE OFFICIEL DES SYMPTÔMES :
${symptomsCatalogPrompt}

DESCRIPTION DE L'AUTOMOBILISTE :
"${text.trim()}"

RÈGLES STRICTES :
1. Tu dois répondre UNIQUEMENT par un objet JSON valide, sans texte additionnel ni markdown.
2. Format : {"symptomId": <ID numérique ou null>, "confidence": <nombre entre 0.0 et 1.0>}
3. Si la description correspond clairement à un symptôme, renvoie son ID exact.
4. Si la description est floue, ambiguë ou inconnue, renvoie "symptomId": null et "confidence": 0.0.
5. Il est STRICTEMENT INTERDIT d'inventer un ID qui ne figure pas dans le catalogue ci-dessus.`;

    const startTime = Date.now();
    let rawResponse = '';

    try {
      rawResponse = await this.llmClient.complete(prompt, { temperature: 0.1, timeoutMs: 3000 });
      const latencyMs = Date.now() - startTime;

      let parsed = {};
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
      } catch (e) {
        parsed = { symptomId: null, confidence: 0 };
      }

      // If AI returned a string code instead of integer ID, map it back
      let candidateId = parsed.symptomId;
      if (typeof candidateId === 'string' && isNaN(Number(candidateId))) {
        const foundByCode = validSymptoms.find(s => s.code.toLowerCase() === candidateId.toLowerCase());
        candidateId = foundByCode ? foundByCode.id : null;
      } else if (candidateId !== null && candidateId !== undefined) {
        candidateId = Number(candidateId);
      }

      // Strict validation through contracts type guard
      const validated = validateIAEntryOutput(
        {
          symptomId: candidateId,
          confidence: Number(parsed.confidence || 0),
          raw: text
        },
        validIds
      );

      // Async audit logging
      logAiAudit({
        sessionId,
        module: 'entry',
        prompt,
        response: rawResponse,
        latencyMs
      });

      return validated;
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      logAiAudit({
        sessionId,
        module: 'entry',
        prompt,
        response: `ERROR: ${err.message}`,
        latencyMs
      });

      return { symptomId: null, confidence: 0, raw: text };
    }
  }
}

module.exports = {
  AIEntryService
};
