/**
 * AutoDiag Diagnostic Engine & AI Layer Contracts
 *
 * Strict interfaces, constants, and runtime type guards.
 * No business logic is defined here. Only data schemas and validators
 * enforcing boundary safety between the deterministic rule engine and peripheral AI.
 */

// --- Constants ---
const SEUIL_CONFIANCE_MIN = 0.60;
const SEUIL_SAFETY = 'safety_critical';
const CODE_FALLBACK_TAG = 'ai_fallback_unverified';

/**
 * @typedef {Object} VehicleContext
 * @property {string|null} [engine]
 * @property {number|null} [mileage]
 * @property {number|null} [year]
 * @property {string|null} [fuelType]
 * @property {string|null} [brand]
 * @property {string|null} [model]
 */

/**
 * @typedef {Object} DiagnosticInput
 * @property {number} userId
 * @property {number} vehicleId
 * @property {string|null} [symptomText]
 * @property {number|string|null} [symptomId]
 * @property {VehicleContext} [vehicleContext]
 */

/**
 * @typedef {Object} FaultCandidate
 * @property {string} faultCode
 * @property {number} confidence
 * @property {string} [name]
 * @property {string} [gravity]
 */

/**
 * @typedef {Object} DiagnosticResult
 * @property {number|null} sessionId
 * @property {string|null} faultCode
 * @property {number|null} confidence
 * @property {'rules'|'ai_fallback_unverified'} source
 * @property {string} reason
 * @property {boolean} safetyAlert
 * @property {string} explanation
 * @property {FaultCandidate[]} candidates
 * @property {boolean} needsProfessional
 */

/**
 * @typedef {Object} IAEntryOutput
 * @property {number|string|null} symptomId
 * @property {number} confidence
 * @property {string} raw
 */

/**
 * @typedef {Object} IAExplainOutput
 * @property {string} text
 */

/**
 * @typedef {Object} FallbackHypothesis
 * @property {string} label
 * @property {string} rationale
 * @property {false} verified
 */

/**
 * @typedef {Object} IAFallbackOutput
 * @property {FallbackHypothesis[]} hypotheses
 * @property {string} disclaimer
 */

// --- Type Guards / Validators ---

/**
 * Validates DiagnosticInput structure.
 * @param {any} input
 * @returns {boolean}
 */
function isValidDiagnosticInput(input) {
  if (!input || typeof input !== 'object') return false;
  if (!input.userId || typeof input.userId !== 'number') return false;
  if (!input.vehicleId || typeof input.vehicleId !== 'number') return false;
  return true;
}

/**
 * Validates IAEntryOutput against a whitelist of valid symptom IDs from the database.
 * If symptomId is not in validSymptomIds, neutralizes it to null with confidence 0.
 * @param {any} output
 * @param {Array<number|string>} validSymptomIds
 * @returns {IAEntryOutput}
 */
function validateIAEntryOutput(output, validSymptomIds = []) {
  if (!output || typeof output !== 'object') {
    return { symptomId: null, confidence: 0, raw: '' };
  }

  const raw = typeof output.raw === 'string' ? output.raw : '';
  let confidence = typeof output.confidence === 'number' ? output.confidence : 0;
  let symptomId = output.symptomId !== undefined && output.symptomId !== null ? output.symptomId : null;

  // Whitelist check
  if (symptomId !== null) {
    const isWhitelisted = validSymptomIds.some(
      validId => String(validId) === String(symptomId)
    );
    if (!isWhitelisted) {
      symptomId = null;
      confidence = 0;
    }
  }

  return {
    symptomId,
    confidence: Math.max(0, Math.min(1, confidence)),
    raw
  };
}

/**
 * Validates IAExplainOutput.
 * Strictly forbids any token resembling FAULT-***-*** unless explicitly permitted in allowedFaultCodes.
 * @param {any} output
 * @param {string[]} allowedFaultCodes Whitelist of fault codes produced by DiagnosticEngine
 * @returns {IAExplainOutput}
 * @throws {Error} If an unwhitelisted fault code pattern is detected in the explanation text
 */
function validateIAExplainOutput(output, allowedFaultCodes = []) {
  if (!output || typeof output !== 'object' || typeof output.text !== 'string') {
    throw new Error('Invalid IAExplainOutput: expected object with string property "text"');
  }

  const text = output.text;
  const faultCodeRegex = /\bFAULT-[A-Z0-9]+-[A-Z0-9]+\b/g;
  const matches = text.match(faultCodeRegex) || [];

  const allowedSet = new Set((allowedFaultCodes || []).map(c => String(c).toUpperCase()));

  for (const match of matches) {
    if (!allowedSet.has(match.toUpperCase())) {
      throw new Error(`AI hallucination rejected: fault code ${match} is not in allowed candidates whitelist`);
    }
  }

  return { text };
}

/**
 * Validates IAFallbackOutput.
 * Must include disclaimer, verified must be false for every item, and NEVER contain a fault_code or numeric score.
 * @param {any} output
 * @returns {IAFallbackOutput}
 */
function validateIAFallbackOutput(output) {
  if (!output || typeof output !== 'object') {
    throw new Error('Invalid IAFallbackOutput: expected an object');
  }

  if (typeof output.disclaimer !== 'string' || output.disclaimer.trim().length === 0) {
    throw new Error('Invalid IAFallbackOutput: missing mandatory disclaimer');
  }

  if (!Array.isArray(output.hypotheses)) {
    throw new Error('Invalid IAFallbackOutput: hypotheses must be an array');
  }

  const faultCodeRegex = /\bFAULT-[A-Z0-9]+-[A-Z0-9]+\b/;

  const validatedHypotheses = output.hypotheses.map((h, idx) => {
    if (!h || typeof h !== 'object' || !h.label || !h.rationale) {
      throw new Error(`Invalid hypothesis at index ${idx}: label and rationale required`);
    }

    if (faultCodeRegex.test(h.label) || faultCodeRegex.test(h.rationale)) {
      throw new Error(`Invalid hypothesis at index ${idx}: AI fallback must NEVER produce FAULT-***-*** codes`);
    }

    if (h.score !== undefined || h.confidence !== undefined) {
      throw new Error(`Invalid hypothesis at index ${idx}: AI fallback must NEVER produce scores or confidence metrics`);
    }

    return {
      label: String(h.label),
      rationale: String(h.rationale),
      verified: false // FORCED TO FALSE
    };
  });

  return {
    hypotheses: validatedHypotheses,
    disclaimer: output.disclaimer
  };
}

module.exports = {
  SEUIL_CONFIANCE_MIN,
  SEUIL_SAFETY,
  CODE_FALLBACK_TAG,
  isValidDiagnosticInput,
  validateIAEntryOutput,
  validateIAExplainOutput,
  validateIAFallbackOutput
};
