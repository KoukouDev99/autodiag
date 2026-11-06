/**
 * AI Fallback Module: Unverified Fallback Suggestions
 * 
 * Activated ONLY when the deterministic engine returns NO match for the given input.
 * Safety guard: Forces verified=false, always includes mandatory disclaimer,
 * and strictly forbids any FAULT-*** code or numeric score.
 */

const { validateIAFallbackOutput } = require('../contracts');
const { logAiAudit, createLLMClient } = require('./llmClient');

class AIFallbackService {
  /**
   * @param {import('./llmClient').ILLMClient} [llmClient]
   */
  constructor(llmClient = null) {
    this.llmClient = llmClient || createLLMClient();
  }

  /**
   * Suggests general educational possibilities when deterministic rules have no match.
   * @param {string} symptomText
   * @param {Object} [vehicleContext={}]
   * @param {number|null} [sessionId=null]
   * @returns {Promise<import('../contracts').IAFallbackOutput>}
   */
  async suggestFallback(symptomText, vehicleContext = {}, sessionId = null) {
    const vDesc = vehicleContext
      ? `${vehicleContext.brand || ''} ${vehicleContext.model || ''} ${vehicleContext.engine || ''} (${vehicleContext.year || ''})`.trim()
      : 'Véhicule';

    const prompt = `Tu es un système de suggestion indicative automobile en mode secours.
La base de connaissances certifiée n'a trouvé AUCUN résultat direct pour le problème suivant :
Véhicule : ${vDesc}
Description utilisateur : "${symptomText || 'Non spécifié'}"

TÂCHE :
Propose entre 1 et 3 pistes mécaniques générales à explorer avec un garagiste.

RÈGLES STRICTES DE SÉCURITÉ :
1. Réponds UNIQUEMENT par un objet JSON valide suivant exactement ce format :
{
  "hypotheses": [
    { "label": "Nom de la pièce ou du circuit", "rationale": "Pourquoi cette piste est envisageable" }
  ],
  "disclaimer": "NON VÉRIFIÉ — Les règles certifiées n'ont trouvé aucune correspondance directe. Ces pistes indicatives ne remplacent pas un examen en atelier."
}
2. Il est STRICTEMENT INTERDIT de générer un code de type FAULT-***.
3. Il est STRICTEMENT INTERDIT de donner un score numérique ou une probabilité chiffrée.
4. Le champ "disclaimer" est obligatoire.`;

    const startTime = Date.now();
    let rawResponse = '';

    try {
      rawResponse = await this.llmClient.complete(prompt, { temperature: 0.2, timeoutMs: 3000 });
      const latencyMs = Date.now() - startTime;

      let parsed = {};
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawResponse);
      } catch (e) {
        parsed = {
          hypotheses: [
            { label: 'Examen général du circuit concerné', rationale: 'Comportement inhabituel nécessitant un contrôle visuel' }
          ],
          disclaimer: 'NON VÉRIFIÉ — consulter un professionnel. Aucune règle certifiée n\'a pu confirmer ce cas.'
        };
      }

      if (!parsed.disclaimer) {
        parsed.disclaimer = 'NON VÉRIFIÉ — consulter un professionnel.';
      }

      // Pass through strict contract validator
      const validated = validateIAFallbackOutput(parsed);

      logAiAudit({
        sessionId,
        module: 'fallback',
        prompt,
        response: rawResponse,
        latencyMs
      });

      return validated;
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      logAiAudit({
        sessionId,
        module: 'fallback',
        prompt,
        response: `ERROR: ${err.message}`,
        latencyMs
      });

      return {
        hypotheses: [
          {
            label: 'Contrôle technique en atelier recommandé',
            rationale: 'Aucune règle certifiée ne correspond à cette combinaison de symptômes.',
            verified: false
          }
        ],
        disclaimer: 'NON VÉRIFIÉ — consulter un professionnel.'
      };
    }
  }
}

module.exports = {
  AIFallbackService
};
