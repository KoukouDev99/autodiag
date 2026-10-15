const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');

// IA #1: Semantic Symptom Normalization (FastAPI microservice proxy + deterministic fallback)
router.post('/normalize-symptom', async (req, res) => {
  try {
    const { text, threshold = 0.60, top_k = 3 } = req.body;
    if (!text || !text.trim()) {
      return res.json({
        symptom_id: null,
        code: null,
        label: null,
        category: null,
        score: 0.0,
        needs_clarification: true,
        message: 'Veuillez saisir votre observation.',
        threshold,
        top_3_alternatives: [],
        fallback_applied: false
      });
    }

    // 1. Try local FastAPI microservice (port 8001 or AI_SERVICE_URL)
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
    try {
      const aiResponse = await fetch(`${aiServiceUrl}/api/normalize-symptom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, threshold, top_k }),
        signal: AbortSignal.timeout(3000)
      });
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        return res.json(data);
      }
    } catch (aiErr) {
      console.warn('[AI Service] FastAPI offline or timed out, executing deterministic keyword fallback:', aiErr.message);
    }

    // 2. Deterministic Fallback if AI service is offline
    const pool = getPool();
    const [symptoms] = await pool.query('SELECT id, code, label, category, description FROM symptoms');
    const qLower = text.toLowerCase();

    const scored = symptoms.map(s => {
      const corpus = `${s.label} ${s.category} ${s.description}`.toLowerCase();
      const terms = qLower.split(/\s+/).filter(w => w.length > 2);
      let matchCount = 0;
      terms.forEach(t => { if (corpus.includes(t)) matchCount++; });
      const score = terms.length > 0 ? Math.min(0.85, (matchCount / terms.length) * 0.7 + (matchCount > 0 ? 0.25 : 0)) : 0;
      return {
        symptom_id: s.id,
        code: s.code,
        label: s.label,
        category: s.category,
        score: Number(score.toFixed(4))
      };
    }).sort((a, b) => b.score - a.score);

    const topAlternatives = scored.slice(0, top_k);
    const best = topAlternatives[0] || { score: 0 };
    const needsClarification = best.score < threshold;

    return res.json({
      symptom_id: needsClarification ? null : best.symptom_id,
      code: needsClarification ? null : best.code,
      label: needsClarification ? null : best.label,
      category: needsClarification ? null : best.category,
      score: best.score,
      needs_clarification: needsClarification,
      message: needsClarification ? 'Symptôme ambigu ou trop vague. Veuillez préciser vos observations.' : null,
      threshold,
      top_3_alternatives: topAlternatives,
      fallback_applied: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message, fallback_applied: true });
  }
});

// IA #2: Beginner Question Reformulation (FastAPI microservice proxy + deterministic fallback)
router.post('/reformulate-question', async (req, res) => {
  const { question, context, options } = req.body;
  if (!question || !question.trim()) {
    return res.json({
      original_question: '',
      reformulated_question: '',
      explanation_hint: null,
      fallback_applied: true
    });
  }

  // 1. Try local FastAPI microservice (port 8001 or AI_SERVICE_URL)
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
  try {
    const aiResponse = await fetch(`${aiServiceUrl}/api/reformulate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, options }),
      signal: AbortSignal.timeout(3000)
    });
    if (aiResponse.ok) {
      const data = await aiResponse.json();
      return res.json(data);
    }
  } catch (aiErr) {
    console.warn('[AI Service] FastAPI offline or timed out for reformulation, applying fallback:', aiErr.message);
  }

  // 2. Deterministic Fallback: return original question with hint
  let hint = null;
  const qLower = question.toLowerCase();
  if (qLower.includes('démarreur')) hint = "Le démarreur est le moteur électrique qui lance le moteur au tour de clé.";
  else if (qLower.includes('solénoïde')) hint = "Le solénoïde est l'interrupteur magnétique du démarreur qui fait 'clac'.";
  else if (qLower.includes('pompe')) hint = "La pompe de gavage envoie le carburant vers le moteur.";
  else if (qLower.includes('alternateur')) hint = "L'alternateur produit l'électricité et recharge la batterie quand le moteur tourne.";
  else if (qLower.includes('étrier') || qLower.includes('frein')) hint = "Le système de freinage ralentit les roues via les plaquettes et disques.";

  return res.json({
    original_question: question,
    reformulated_question: question,
    explanation_hint: hint,
    fallback_applied: true
  });
});

// IA #3: Technical RAG Context Retrieval (FastAPI microservice proxy + deterministic fallback)
router.post('/retrieve-context', async (req, res) => {
  const { query, top_k = 3, min_score = 0.25, filter_doc_type } = req.body;
  if (!query || !query.trim()) {
    return res.json({
      query: '',
      passages: [],
      total: 0,
      fallback_applied: false
    });
  }

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
  try {
    const aiResponse = await fetch(`${aiServiceUrl}/api/retrieve-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k, min_score, filter_doc_type }),
      signal: AbortSignal.timeout(3000)
    });
    if (aiResponse.ok) {
      const data = await aiResponse.json();
      return res.json(data);
    }
  } catch (aiErr) {
    console.warn('[AI Service] FastAPI offline or timed out for RAG, applying fallback:', aiErr.message);
  }

  // Deterministic SQL Fallback
  try {
    const pool = getPool();
    const [faults] = await pool.query(
      `SELECT f.code as fault_code, f.name as title, f.description as content, 
              f.cost_min, f.cost_max, f.is_danger, 'fault' as doc_type
       FROM faults f 
       WHERE f.name LIKE ? OR f.description LIKE ? OR f.code LIKE ?
       LIMIT ?`,
      [`%${query}%`, `%${query}%`, `%${query}%`, top_k]
    );

    const passages = faults.map(f => ({
      doc_id: `fault-${f.fault_code}`,
      doc_type: 'fault',
      fault_code: f.fault_code,
      title: f.title,
      content: `PANNE TECHNIQUE [${f.fault_code}] : ${f.title}. ${f.content}. Fourchette de coût : ${f.cost_min}€ à ${f.cost_max}€.`,
      score: 0.75,
      source_id: 2,
      source_name: 'AutoDiag Diagnostic Sensory Trees & Workshop Heuristics',
      license: 'CC-BY-NC-SA 4.0',
      version: '4.2',
      metadata: { cost_min: f.cost_min, cost_max: f.cost_max, is_danger: Boolean(f.is_danger) }
    }));

    return res.json({
      query,
      passages,
      total: passages.length,
      fallback_applied: true
    });
  } catch (dbErr) {
    return res.json({ query, passages: [], total: 0, fallback_applied: true });
  }
});

// IA #4: Plain Language Diagnostic Explanation (FastAPI microservice proxy + deterministic fallback)
router.post('/explain-diagnosis', async (req, res) => {
  const { fault_code, fault_name, symptoms, context, top_k_rag = 3 } = req.body;

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
  try {
    const aiResponse = await fetch(`${aiServiceUrl}/api/explain-diagnosis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fault_code, fault_name, symptoms, context, top_k_rag }),
      signal: AbortSignal.timeout(5000)
    });
    if (aiResponse.ok) {
      const data = await aiResponse.json();
      return res.json(data);
    }
  } catch (aiErr) {
    console.warn('[AI Service] FastAPI offline or timed out for explanation, applying fallback:', aiErr.message);
  }

  // Deterministic Fallback: 4 mandatory sections + confidence <= 95%
  const name = fault_name || 'Défaut mécanique';
  const whatIsHappening = `Votre véhicule rencontre un dysfonctionnement technique lié à : ${name.toLowerCase()}.`;
  const probableCause = `L'usure naturelle ou les contraintes de fonctionnement empêchent le bon fonctionnement du composant concerné.`;
  const whatToDo = `1. Contrôle visuel préliminaire sans démontage (Gratuit / 0€).\n2. Remplacement ou réparation de la pièce défaillante (estimation 80€ à 250€).\n3. Passage à la valise électronique en atelier si le problème persiste.`;
  const warning = `En cas d'odeur anormale, de fumée, de voyant rouge allumé ou de comportement dangereux du véhicule, arrêtez immédiatement le véhicule et contactez un dépanneur.`;
  
  const confidence = Math.min(88, 95);

  return res.json({
    fault_code: fault_code || null,
    fault_name: name,
    explanation: `🔍 CE QUI SE PASSE :\n${whatIsHappening}\n\n🎯 CAUSE PROBABLE :\n${probableCause}\n\n🔧 QUOI FAIRE :\n${whatToDo}\n\n⚠️ ATTENTION :\n${warning}\n\nCONFIANCE : ${confidence}%`,
    sections: {
      what_is_happening: whatIsHappening,
      probable_cause: probableCause,
      what_to_do: whatToDo,
      warning: warning
    },
    confidence,
    source_citations: [
      {
        source_id: 2,
        source_name: 'AutoDiag Diagnostic Sensory Trees & Workshop Heuristics',
        license: 'CC-BY-NC-SA 4.0',
        version: '4.2'
      }
    ],
    fallback_applied: true
  });
});

// IA #5: Safety Guard (FastAPI microservice proxy + deterministic fallback)
router.post('/check-safety', async (req, res) => {
  const { text, fault_code, system, is_danger_known, symptoms, context } = req.body;

  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
  try {
    const aiResponse = await fetch(`${aiServiceUrl}/api/check-safety`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fault_code, system, is_danger_known, symptoms, context }),
      signal: AbortSignal.timeout(3000)
    });
    if (aiResponse.ok) {
      const data = await aiResponse.json();
      return res.json(data);
    }
  } catch (aiErr) {
    console.warn('[AI Service] FastAPI offline or timed out for safety check, applying local fallback:', aiErr.message);
  }

  // Deterministic Fallback : evaluate critical regex patterns
  const combined = `${text || ''} ${context || ''} ${(symptoms || []).join(' ')} ${system || ''}`.toLowerCase();
  
  if (is_danger_known || /frein|pédale.*molle|perte.*frein|disque.*rouge/.test(combined)) {
    return res.json({
      is_danger: true,
      severity: 'critical',
      critical_system: 'Freinage',
      danger_reason: "Défaillance ou perte d'efficacité critique du circuit de freinage.",
      immediate_action: "Arrêtez le véhicule immédiatement en lieu sécurisé. Ne roulez sous aucun prétexte et contactez une dépanneuse.",
      detection_source: 'deterministic_rule',
      confidence: 95,
      fallback_applied: true
    });
  }

  if (/direction.*bloqu|volant.*dur|perte.*direction/.test(combined)) {
    return res.json({
      is_danger: true,
      severity: 'critical',
      critical_system: 'Direction',
      danger_reason: "Blocage ou anomalie sévère de la direction assistée.",
      immediate_action: "Immobilisation immédiate. Ne forcez pas sur le volant et faites remorquer le véhicule.",
      detection_source: 'deterministic_rule',
      confidence: 95,
      fallback_applied: true
    });
  }

  if (/surchauffe|aiguille.*rouge|fumée.*blanche|liquide.*bout/.test(combined)) {
    return res.json({
      is_danger: true,
      severity: 'high',
      critical_system: 'Refroidissement / Surchauffe',
      danger_reason: "Surchauffe thermique extrême du moteur.",
      immediate_action: "Arrêtez le moteur dès que possible. Ne touchez JAMAIS au bouchon de radiateur moteur chaud.",
      detection_source: 'deterministic_rule',
      confidence: 95,
      fallback_applied: true
    });
  }

  if (/odeur.*essence|fuite.*carburant|flamme|fumée.*noire/.test(combined)) {
    return res.json({
      is_danger: true,
      severity: 'critical',
      critical_system: 'Carburant / Incendie',
      danger_reason: "Fuite inflammable de carburant ou amorce d'incendie.",
      immediate_action: "Évacuez les occupants, coupez le contact et appelez les services d'urgence (18/112).",
      detection_source: 'deterministic_rule',
      confidence: 95,
      fallback_applied: true
    });
  }

  if (/voyant.*rouge|voyant.*stop/.test(combined)) {
    return res.json({
      is_danger: true,
      severity: 'high',
      critical_system: 'Alerte Combiné',
      danger_reason: "Alerte de gravité maximale déclenchée par le calculateur de bord (voyant STOP ou rouge).",
      immediate_action: "Arrêt impératif du véhicule conformément aux consignes du constructeur.",
      detection_source: 'deterministic_rule',
      confidence: 95,
      fallback_applied: true
    });
  }

  return res.json({
    is_danger: false,
    severity: 'low',
    critical_system: null,
    danger_reason: null,
    immediate_action: "Aucun risque de sécurité vitale détecté. Vous pouvez poursuivre le diagnostic.",
    detection_source: 'deterministic_rule',
    confidence: 95,
    fallback_applied: true
  });
});

module.exports = router;
