/**
 * AutoDiag Hybrid Diagnostic Orchestrator
 *
 * Enforces strict hierarchy:
 * 1. Safety Rules (Hard Stop, cannot be softened)
 * 2. Deterministic Rule Engine (DiagnosticEngine.evaluate — SOLE DECISION AUTHORITY)
 * 3. Peripheral AI (Entry normalization, Output vulgarization, Unverified fallback)
 *
 * Absolutely forbidden:
 * - AI never decides or alters fault_code or confidence score.
 * - AI never writes directly to diagnostic_sessions or session_answers.
 * - AI never exposes a fault_code absent from faults table.
 */

const { getPool } = require('../db/db');
const DiagnosticEngine = require('../services/diagnosticEngine');
const {
  SEUIL_CONFIANCE_MIN,
  SEUIL_SAFETY,
  CODE_FALLBACK_TAG,
  isValidDiagnosticInput
} = require('./contracts');
const { AIEntryService } = require('./ai/aiEntry');
const { AIExplainService } = require('./ai/aiExplain');
const { AIFallbackService } = require('./ai/aiFallback');
const { createLLMClient } = require('./ai/llmClient');

class HybridDiagnosticOrchestrator {
  /**
   * @param {Object} [options]
   * @param {import('./ai/llmClient').ILLMClient} [options.llmClient]
   * @param {boolean} [options.aiEnabled]
   */
  constructor(options = {}) {
    this.llmClient = options.llmClient || createLLMClient();
    this.aiEnabled = options.aiEnabled !== undefined 
      ? options.aiEnabled 
      : (process.env.AI_ENABLED === 'true' || process.env.AI_ENABLED === '1');

    this.aiEntry = new AIEntryService(this.llmClient);
    this.aiExplain = new AIExplainService(this.llmClient);
    this.aiFallback = new AIFallbackService(this.llmClient);
  }

  /**
   * Finds or creates a diagnostic session following idempotence constraints.
   * If an in_progress session exists for (userId, vehicleId), reuse it.
   */
  async getOrCreateSession(pool, userId, vehicleId, symptomId, symptomLabel = 'Diagnostic') {
    // 1. Check for existing in_progress session
    const [existing] = await pool.query(
      `SELECT id, symptom_id, status FROM diagnostic_sessions
       WHERE user_id = ? AND vehicle_id = ? AND status = 'in_progress'
       ORDER BY id DESC LIMIT 1`,
      [userId, vehicleId]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // 2. Insert new session
    const [created] = await pool.query(
      `INSERT INTO diagnostic_sessions (user_id, vehicle_id, symptom_id, status, current_step, summary_title, summary_desc)
       VALUES (?, ?, ?, 'in_progress', 1, ?, 'Session démarrée')`,
      [userId, vehicleId, symptomId, symptomLabel]
    );

    return created.insertId;
  }

  /**
   * Checks database safety rules against symptoms and user description.
   */
  async checkSafetyRules(pool, symptomCodeOrText, userText = '') {
    try {
      const [rules] = await pool.query('SELECT * FROM safety_rules');
      const textToScan = `${symptomCodeOrText || ''} ${userText || ''}`.toLowerCase();

      for (const rule of rules) {
        const patterns = (rule.symptom_pattern || '').split('|').map(p => p.trim().toLowerCase());
        for (const pattern of patterns) {
          if (pattern && textToScan.includes(pattern)) {
            return {
              isSafetyAlert: true,
              matchedRule: rule,
              message: rule.message,
              severity: rule.severity,
              faultCode: rule.fault_code || null
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Safety Rules] Non-fatal DB query issue, falling back to engine check:', err.message);
    }

    // Engine fallback safety check
    const engineSafety = DiagnosticEngine.checkImmediateRisks({ code: symptomCodeOrText }, userText, []);
    if (engineSafety.is_safety_stop) {
      const firstAlert = engineSafety.alerts[0] || {};
      return {
        isSafetyAlert: true,
        matchedRule: null,
        message: `${firstAlert.title || 'DANGER CRITIQUE'} : ${firstAlert.instruction || 'Ne pas conduire'}`,
        severity: 'safety_critical',
        faultCode: null
      };
    }

    return { isSafetyAlert: false };
  }

  /**
   * Main Orchestrator Execution Flow
   * @param {import('./contracts').DiagnosticInput} input
   * @returns {Promise<import('./contracts').DiagnosticResult>}
   */
  async runDiagnostic(input) {
    if (!isValidDiagnosticInput(input)) {
      throw new Error('Invalid DiagnosticInput: userId and vehicleId are required numbers');
    }

    const pool = getPool();
    const { userId, vehicleId, symptomText, vehicleContext = {} } = input;
    let targetSymptomId = input.symptomId || null;

    // Fetch vehicle details from DB if not fully provided
    let targetVehicleId = vehicleId;
    let [vehicleRows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [targetVehicleId]);
    if (vehicleRows.length === 0) {
      const [vFall] = await pool.query('SELECT * FROM vehicles ORDER BY is_primary DESC, id ASC LIMIT 1');
      if (vFall.length > 0) {
        vehicleRows = vFall;
        targetVehicleId = vFall[0].id;
      }
    }
    const vehicle = vehicleRows.length > 0 ? vehicleRows[0] : { id: targetVehicleId, ...vehicleContext };

    // --- STEP 1 : Resolve symptomId ---
    const [allSymptoms] = await pool.query('SELECT id, code, label FROM symptoms');

    if (!targetSymptomId && symptomText) {
      if (this.aiEnabled) {
        const entryResult = await this.aiEntry.normalizeSymptom(symptomText, allSymptoms);
        targetSymptomId = entryResult.symptomId;
      } else {
        // DB-only keyword match
        const lower = symptomText.toLowerCase();
        const found = allSymptoms.find(s => lower.includes(s.label.toLowerCase()) || lower.includes(s.code.toLowerCase()));
        targetSymptomId = found ? found.id : null;
      }
    }

    // --- STEP 1a : Immediate Safety Rules Check (Hard Stop) ---
    const upfrontSafety = await this.checkSafetyRules(pool, targetSymptomId, symptomText);
    if (upfrontSafety.isSafetyAlert) {
      const sessionId = await this.getOrCreateSession(pool, userId, targetVehicleId, targetSymptomId || 1, 'Arrêt d\'urgence Sécurité');
      return {
        sessionId,
        faultCode: upfrontSafety.faultCode,
        confidence: 1.0,
        source: 'rules',
        reason: 'safety_stop_triggered',
        safetyAlert: true,
        explanation: upfrontSafety.message,
        candidates: upfrontSafety.faultCode ? [{ faultCode: upfrontSafety.faultCode, confidence: 100 }] : [],
        needsProfessional: true
      };
    }

    if (!targetSymptomId) {
      return {
        sessionId: null,
        faultCode: null,
        confidence: null,
        source: 'rules',
        reason: 'symptom_unresolved',
        safetyAlert: false,
        explanation: 'Impossible d\'identifier le symptôme à partir de la description fournie. Veuillez sélectionner un symptôme dans la liste.',
        candidates: [],
        needsProfessional: true
      };
    }

    const matchedSymptom = allSymptoms.find(s => String(s.id) === String(targetSymptomId)) || { id: targetSymptomId, code: 'symptom', label: 'Diagnostic' };

    // Get or reuse in_progress session (Idempotence)
    const sessionId = await this.getOrCreateSession(pool, userId, targetVehicleId, matchedSymptom.id, matchedSymptom.label);

    // --- STEP 2 : Check Safety Rules (Hard Stop) ---
    const safetyCheck = await this.checkSafetyRules(pool, matchedSymptom.code, symptomText);
    if (safetyCheck.isSafetyAlert) {
      return {
        sessionId,
        faultCode: safetyCheck.faultCode,
        confidence: 1.0,
        source: 'rules',
        reason: 'safety_stop_triggered',
        safetyAlert: true,
        explanation: safetyCheck.message,
        candidates: safetyCheck.faultCode ? [{ faultCode: safetyCheck.faultCode, confidence: 100 }] : [],
        needsProfessional: true
      };
    }

    // --- STEP 3 : Call Deterministic DiagnosticEngine.evaluate ---
    // Fetch hypotheses and compatibilities
    const [hypotheses] = await pool.query(
      `SELECT f.id, fs.symptom_id, f.name, f.code as fault_code, f.description,
              f.gravity_label as gravity, f.cost_min, f.cost_max, f.is_danger,
              fs.relevance_score, fs.is_primary,
              ROW_NUMBER() OVER (ORDER BY fs.relevance_score DESC, f.id ASC) as order_index,
              dt.instruction as check_action, dt.title as test_title
       FROM faults f
       JOIN fault_symptoms fs ON f.id = fs.fault_id
       LEFT JOIN diagnostic_tests dt ON f.id = dt.fault_id
       WHERE fs.symptom_id = ?
       ORDER BY fs.relevance_score DESC, fs.is_primary DESC, f.id ASC`,
      [matchedSymptom.id]
    );

    // Fetch existing answers for this session
    const [answers] = await pool.query(
      `SELECT sa.session_id, sa.question_id, sa.option_id, ao.label as option_title
       FROM session_answers sa
       LEFT JOIN answer_options ao ON sa.option_id = ao.id
       WHERE sa.session_id = ?`,
      [sessionId]
    );

    const [compatibilities] = await pool.query('SELECT * FROM fault_vehicles');
    const optionIds = answers.map(a => a.option_id);
    let rules = [];
    if (optionIds.length > 0) {
      const [ruleRows] = await pool.query(
        `SELECT dr.*, ao.label as option_title FROM diagnostic_rules dr
         LEFT JOIN answer_options ao ON dr.answer_option_id = ao.id
         WHERE dr.answer_option_id IN (${optionIds.map(() => '?').join(',')})`,
        optionIds
      );
      rules = ruleRows;
    }

    const evalResult = DiagnosticEngine.evaluate(hypotheses, answers, vehicle, rules, compatibilities);

    const candidates = (evalResult.hypotheses || []).map(h => ({
      faultCode: h.code || h.fault_code || `FAULT-${h.id}`,
      name: h.name,
      confidence: h.confidence_percent || 0,
      gravity: h.gravity || 'Moyenne'
    }));

    const topHypo = evalResult.top_hypothesis;
    const topFaultCode = topHypo ? (topHypo.code || topHypo.fault_code || `FAULT-${topHypo.id}`) : null;
    const confidenceScore = topHypo ? (topHypo.confidence_percent / 100) : 0;

    // --- STEP 4 : Confirmed Confidence (confidence >= SEUIL_CONFIANCE_MIN) ---
    if (topFaultCode && confidenceScore >= SEUIL_CONFIANCE_MIN) {
      let explanationText = `Panne identifiée : ${topHypo.name}.`;
      if (this.aiEnabled) {
        const aiExplainResult = await this.aiExplain.explainResult(
          { top_hypothesis: topHypo, candidates, observations: answers.map(a => a.option_title) },
          'fr',
          sessionId
        );
        explanationText = aiExplainResult.text;
      }

      return {
        sessionId,
        faultCode: topFaultCode,
        confidence: confidenceScore,
        source: 'rules',
        reason: 'deterministic_match_high_confidence',
        safetyAlert: false,
        explanation: explanationText,
        candidates,
        needsProfessional: false
      };
    }

    // --- STEP 5 : Insufficient Confidence (confidence < SEUIL_CONFIANCE_MIN) ---
    if (topFaultCode && confidenceScore < SEUIL_CONFIANCE_MIN) {
      return {
        sessionId,
        faultCode: topFaultCode,
        confidence: confidenceScore,
        source: 'rules',
        reason: 'insufficient_confidence',
        safetyAlert: false,
        explanation: `Plusieurs causes restent possibles (confiance ${Math.round(confidenceScore * 100)}%). Un examen professionnel en atelier est requis pour trancher.`,
        candidates,
        needsProfessional: true
      };
    }

    // --- STEP 6 : No DB Match -> AI Fallback ---
    if (!topFaultCode || hypotheses.length === 0) {
      if (this.aiEnabled) {
        const fallbackResult = await this.aiFallback.suggestFallback(symptomText, vehicle, sessionId);
        return {
          sessionId,
          faultCode: null,
          confidence: null,
          source: CODE_FALLBACK_TAG,
          reason: 'no_rules_match_fallback',
          safetyAlert: false,
          explanation: `${fallbackResult.disclaimer} Pistes indicatives : ${fallbackResult.hypotheses.map(h => `${h.label} (${h.rationale})`).join(' ; ')}`,
          candidates: fallbackResult.hypotheses.map(h => ({
            faultCode: 'NON_VERIFIE',
            name: h.label,
            confidence: 0,
            verified: false
          })),
          needsProfessional: true
        };
      }

      return {
        sessionId,
        faultCode: null,
        confidence: null,
        source: 'rules',
        reason: 'no_rules_match',
        safetyAlert: false,
        explanation: 'Aucune panne connue ne correspond à cette combinaison dans notre base certifiée. Consultez un professionnel.',
        candidates: [],
        needsProfessional: true
      };
    }

    return {
      sessionId,
      faultCode: topFaultCode,
      confidence: confidenceScore,
      source: 'rules',
      reason: 'evaluated',
      safetyAlert: false,
      explanation: 'Diagnostic calculé.',
      candidates,
      needsProfessional: false
    };
  }
}

module.exports = {
  HybridDiagnosticOrchestrator
};
