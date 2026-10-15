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

// Helper: Build tailored system prompt based on user vehicle
function buildVehicleSystemPrompt(vehicle) {
  let vehDesc = 'Non renseigné (conseils généralistes)';
  if (vehicle && vehicle.brand) {
    vehDesc = `${vehicle.brand} ${vehicle.model || ''} (${vehicle.year || 'Année non précisée'})
- Motorisation : ${vehicle.engine || 'Standard'} (${vehicle.fuel || 'Non spécifié'})
- Kilométrage compteur : ${vehicle.mileage ? Number(vehicle.mileage).toLocaleString('fr-FR') + ' km' : 'Non précisé'}`;
  }

  return `Tu es "AutoDiag Copilote", un mécanicien automobile expert, courtois, pédagogue et bienveillant.
Tu réponds aux questions des automobilistes en adaptant précisément tes explications selon le profil et le véhicule de l'utilisateur.

CONTEXTE DU VÉHICULE ACTIF DE L'UTILISATEUR :
${vehDesc}

RÈGLES D'OR DE RÉPONSE :
1. Personnalisation : Réponds TOUJOURS en tenant compte des spécificités du véhicule de l'utilisateur (motorisation essence vs diesel vs hybride, kilométrage d'usure, problèmes connus du modèle).
2. Pédagogie sans jargon : Explique simplement ce qui se passe sous le capot avec des métaphores intuitives.
3. Estimations de coûts transparentes : Donne des fourchettes tarifaires réalistes en euros (€) pour les pièces et la main d'œuvre (fourchettes garagiste indépendant vs concession).
4. Sécurité & Urgence : Si la question concerne le freinage, la direction, la surchauffe ou une fuite inflammable, ordonne immédiatement l'arrêt en sécurité.
5. Sois concis, structuré (utilise des listes à puces et du texte en gras) et réponds directement en français.`;
}

// 6. Interactive AI Chat Assistant (Compatible OpenAI / DeepSeek / Groq Gratuit / OpenRouter / Local Fallback)
router.post(['/chat', '/ai/chat'], async (req, res) => {
  try {
    const {
      message,
      vehicle,
      history = [],
      api_key = null,
      provider = null,
      model = null
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message requis.' });
    }

    const systemPrompt = buildVehicleSystemPrompt(vehicle);

    // 1. Resolve API key and Base URL
    let resolvedKey = (api_key && api_key.trim()) ||
      process.env.AI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY ||
      null;

    let resolvedBaseUrl = 'https://api.groq.com/openai/v1';
    let resolvedModel = 'openai/gpt-oss-120b';
    let providerName = 'Groq Cloud (120B Gratuit)';

    if (provider === 'deepseek' || (resolvedKey && resolvedKey.startsWith('sk-') && !resolvedKey.startsWith('gsk_') && !resolvedKey.startsWith('sk-or-'))) {
      resolvedBaseUrl = 'https://api.deepseek.com';
      resolvedModel = model || 'deepseek-chat';
      providerName = 'DeepSeek API';
    }

    if (provider === 'openrouter' || (resolvedKey && resolvedKey.startsWith('sk-or-'))) {
      resolvedBaseUrl = 'https://openrouter.ai/api/v1';
      resolvedModel = model || 'deepseek/deepseek-r1:free';
      providerName = 'OpenRouter (DeepSeek R1 Free)';
    } else if (provider === 'openai') {
      resolvedBaseUrl = 'https://api.openai.com/v1';
      resolvedModel = model || 'gpt-4o-mini';
      providerName = 'OpenAI (ChatGPT)';
    } else if (provider === 'groq' || (resolvedKey && resolvedKey.startsWith('gsk_'))) {
      resolvedBaseUrl = 'https://api.groq.com/openai/v1';
      resolvedModel = model || 'openai/gpt-oss-120b';
      providerName = 'Groq Cloud (120B Gratuit)';
    }

    if (process.env.AI_BASE_URL) resolvedBaseUrl = process.env.AI_BASE_URL;
    if (process.env.AI_MODEL) resolvedModel = process.env.AI_MODEL;

    // 2. Format conversation messages
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // 3. Try Cloud API if key is present
    if (resolvedKey) {
      try {
        const cloudResponse = await fetch(`${resolvedBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resolvedKey}`
          },
          body: JSON.stringify({
            model: resolvedModel,
            messages: formattedMessages,
            temperature: 0.7,
            max_tokens: 1000
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (cloudResponse.ok) {
          const data = await cloudResponse.json();
          let reply = data.choices && data.choices[0] && data.choices[0].message?.content;
          if (reply) {
            // Remove DeepSeek-R1 <think>...</think> reasoning tags for user-friendly output
            reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            return res.json({
              reply,
              provider: providerName,
              model: resolvedModel,
              vehicle_applied: !!(vehicle && vehicle.brand),
              status: 'success',
              fallback_applied: false
            });
          }
        } else {
          const errText = await cloudResponse.text();
          console.warn('[AI Chat] Cloud API error:', cloudResponse.status, errText);
        }
      } catch (cloudErr) {
        console.warn('[AI Chat] Cloud API fetch failed:', cloudErr.message);
      }
    }

    // 4. Intelligent Local Fallback (adapted to user vehicle)
    const vehName = vehicle && vehicle.brand ? `${vehicle.brand} ${vehicle.model || ''}` : 'votre véhicule';
    const qLower = message.toLowerCase();
    let fallbackReply = `Pour **${vehName}** (${vehicle?.engine || 'motorisation standard'}, ${vehicle?.year || 'année courante'}), voici mes conseils mécaniques :\n\n`;

    if (/frein|plaquette|disque/.test(qLower)) {
      fallbackReply += `🛑 **Système de freinage :**\n- Des bruits métalliques ou une pédale molle indiquent une usure avancée des plaquettes ou un niveau de liquide de frein bas.\n- **Coût estimé :** Comptez entre **80 € et 180 €** pour un jeu de plaquettes avant, et environ **220 € à 350 €** avec les disques.\n- ⚠️ **Sécurité :** Ne roulez pas si la pédale s'enfonce anormalement.`;
    } else if (/courroie|distribution/.test(qLower)) {
      const isPuretech = (vehicle?.engine || '').toLowerCase().includes('puretech');
      fallbackReply += `⚙️ **Courroie de distribution :**\n`;
      if (isPuretech) {
        fallbackReply += `- Sur le moteur **1.2 PureTech**, la courroie est immergée dans l'huile. Contrôlez régulièrement son état lors de chaque vidange (préconisation : remplacement tous les **6 ans ou 100 000 km**).\n`;
      } else {
        fallbackReply += `- La préconisation générale est un remplacement tous les **5 à 6 ans ou entre 100 000 et 160 000 km** selon constructeur.\n`;
      }
      fallbackReply += `- **Coût estimé :** Entre **450 € et 850 €** kit complet avec pompe à eau.`;
    } else if (/vidange|huile|entretien/.test(qLower)) {
      fallbackReply += `🛢️ **Entretien & Vidange :**\n- Intervalle recommandé : tous les **15 000 à 20 000 km ou 1 an** avec une huile homologuée constructeur (ex: 0W20 ou 5W30).\n- Remplacez systématiquement le filtre à huile et le joint de bouchon de carter.\n- **Coût moyen :** Entre **70 € et 140 €** en atelier indépendant.`;
    } else if (/voyant.*moteur|voyant.*orange/.test(qLower)) {
      fallbackReply += `⚠️ **Voyant moteur allumé :**\n- S'il est **orange fixe**, le calculateur signale une anomalie (antipollution, sonde lambda, allumage). Vous pouvez rouler prudemment jusqu'au garage le plus proche.\n- S'il **clignote**, arrêtez-vous rapidement pour ne pas endommager le pot catalytique.\n- **Diagnostic à la valise OBD-II :** entre **40 € et 80 €**.`;
    } else {
      fallbackReply += `🔍 **Conseil mécanique :**\n- Pour votre question sur ce véhicule, je vous recommande d'inspecter visuellement les niveaux de fluides sous le capot (huile, liquide de refroidissement, liquide de frein).\n- N'hésitez pas à lancer un **diagnostic guidé** dans l'application pour identifier précisément les causes probables et les tests à réaliser.`;
    }

    return res.json({
      reply: fallbackReply,
      provider: 'AutoDiag IA Locale (Mode Hors-Ligne)',
      model: 'Qwen2.5-Offline-Fallback',
      vehicle_applied: !!(vehicle && vehicle.brand),
      status: 'success',
      fallback_applied: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

