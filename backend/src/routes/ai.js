const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');
const { appCache } = require('../utils/cache');
const { aiChatLimiter } = require('../middleware/rateLimiters');

// Circuit-breaker for optional local FastAPI AI microservice (avoids 2-3s TCP timeout per keystroke when offline)
let aiServiceOfflineUntil = 0;

async function fetchLocalAiService(path, payload, timeoutMs = 2500) {
  if (Date.now() < aiServiceOfflineUntil) {
    return null;
  }
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001';
  try {
    const aiResponse = await fetch(`${aiServiceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (aiResponse.ok) {
      aiServiceOfflineUntil = 0;
      return await aiResponse.json();
    }
  } catch (aiErr) {
    aiServiceOfflineUntil = Date.now() + 15000; // 15s circuit breaker cooldown
    console.warn(`[AI Service] FastAPI offline (${path}), using deterministic fallback for 15s.`);
  }
  return null;
}

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

    // 1. Try local FastAPI microservice (with circuit breaker)
    const aiData = await fetchLocalAiService('/api/normalize-symptom', { text, threshold, top_k }, 2500);
    if (aiData) {
      return res.json(aiData);
    }

    // 2. Deterministic Fallback if AI service is offline (using cached symptoms list)
    const pool = getPool();
    let symptoms = appCache.get('symptoms:all');
    if (!symptoms) {
      const [rows] = await pool.query('SELECT * FROM symptoms ORDER BY id ASC');
      symptoms = rows;
      appCache.set('symptoms:all', symptoms, 3600);
    }
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

  // 1. Try local FastAPI microservice (with circuit breaker)
  const aiData = await fetchLocalAiService('/api/reformulate-question', { question, context, options }, 2500);
  if (aiData) {
    return res.json(aiData);
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

  const aiData = await fetchLocalAiService('/api/retrieve-context', { query, top_k, min_score, filter_doc_type }, 2500);
  if (aiData) {
    return res.json(aiData);
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

  const aiData = await fetchLocalAiService('/api/explain-diagnosis', { fault_code, fault_name, symptoms, context, top_k_rag }, 4000);
  if (aiData) {
    return res.json(aiData);
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

  const aiData = await fetchLocalAiService('/api/check-safety', { text, fault_code, system, is_danger_known, symptoms, context }, 2500);
  if (aiData) {
    return res.json(aiData);
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

// Helper: Retrieve relevant knowledge from MySQL database based on user question
async function retrieveDatabaseContext(pool, message, vehicle) {
  let dbContext = '';

  // 1. Detect DTC codes (e.g. P0420, P0300, C1234, B0001, U0100)
  const dtcMatch = message.match(/\b([PCBU][0-9]{4})\b/i);
  if (dtcMatch) {
    const code = dtcMatch[1].toUpperCase();
    try {
      const [rows] = await pool.query('SELECT * FROM dtc_codes WHERE code = ? LIMIT 1', [code]);
      if (rows && rows.length > 0) {
        const dtc = rows[0];
        let causes = [];
        try { causes = typeof dtc.possible_causes === 'string' ? JSON.parse(dtc.possible_causes) : (dtc.possible_causes || []); } catch (_) {}
        dbContext += `\n[FICHE OFFICIELLE DE LA BASE DE DONNÉES - CODE DÉFAUT ${dtc.code}] :
- Définition : ${dtc.description || dtc.title}
- Système : ${dtc.system || 'Moteur'}
- Causes possibles répertoriées : ${causes.length > 0 ? causes.slice(0, 5).join(', ') : 'Capteur, sonde, câblage ou actionneur défectueux'}
- Gravité : ${dtc.urgency || 'Standard'}\n`;
      }
    } catch (e) {
      console.warn('[AI DB RAG] DTC lookup error:', e.message);
    }
  }

  // 2. Search related faults & solutions in database (ex: batterie, alternateur, fap, egr, injecteur, frein, démarreur...)
  const words = message.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['avec', 'pour', 'dans', 'cette', 'votre', 'faire', 'peux', 'quoi'].includes(w));
  if (words.length > 0) {
    try {
      const [faultRows] = await pool.query(
        `SELECT f.code, f.name, f.description, f.cost_min, f.cost_max, f.is_danger,
                s.title as solution_title, s.est_time, s.difficulty
         FROM faults f
         LEFT JOIN solutions s ON f.id = s.fault_id
         WHERE ${words.map(() => '(f.name LIKE ? OR f.description LIKE ?)').join(' OR ')}
         LIMIT 2`,
        words.flatMap(w => [`%${w}%`, `%${w}%`])
      );
      if (faultRows && faultRows.length > 0) {
        dbContext += `\n[DONNÉES ATELIER DE LA BASE DE DONNÉES AUTODIAG] :`;
        for (const f of faultRows) {
          dbContext += `\n- Panne homologuée : ${f.name} (Code : ${f.code})
  Coût moyen vérifié en base : ${f.cost_min} € à ${f.cost_max} €
  Danger vital : ${f.is_danger ? 'OUI (Alerte rouge)' : 'Non'}`;
          if (f.solution_title) {
            dbContext += `\n  Solution recommandée : ${f.solution_title} (Durée estimée : ~${f.est_time || '30 min'}, Difficulté : ${f.difficulty || 'standard'})`;
          }
        }
      }
    } catch (e) {
      console.warn('[AI DB RAG] Faults lookup error:', e.message);
    }
  }

  return dbContext;
}

// Helper: Detect whether a user message is vague, imprecise, incomplete, or a simple greeting
function isVagueOrImpreciseMessage(text) {
  if (!text || typeof text !== 'string') return true;
  const clean = text.trim();
  if (clean.length < 3) return true;

  // If message contains a standard automotive DTC code (e.g. P0300, P0420, C1234, U0100) -> NOT vague
  if (/\b[PCBU][0-9]{4}\b/i.test(clean)) return false;

  const lower = clean.toLowerCase();
  const normalized = lower
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Direct match on common greetings & pure help cries (FR & EN)
  const vagueExactPhrases = new Set([
    'bonjour', 'salut', 'coucou', 'hello', 'hi', 'bonsoir', 'yo', 'slt', 'bjr', 'bsr',
    'aide', 'aide moi', 'aidez moi', 'aidez moi svp', 'aide moi svp', 'help', 'help me', 'sos', 'au secours',
    'ca marche pas', 'ca ne marche pas', 'marche pas', 'marche plus', 'ca marche plus',
    'ne marche pas', 'ne fonctionne pas', 'ca ne fonctionne pas', 'ca ne fonctionne plus',
    'en panne', 'ma voiture est en panne', 'je suis en panne', 'voiture en panne', 'mon vehicule est en panne',
    'my car is broken', 'car is broken', 'car broken', 'not working', 'it does not work', 'my car won t start',
    'j ai un probleme', 'jai un probleme', 'ma voiture a un probleme', 'probleme', 'un probleme', 'souci', 'un souci',
    'j ai un souci', 'jai un souci', 'ma voiture a un souci', 'mon auto a un probleme',
    'j ai un bruit', 'jai un bruit', 'un bruit', 'bruit', 'bruit bizarre', 'drole de bruit', 'ca fait du bruit', 'du bruit',
    'bruit anormal', 'bruit moteur', 'bruit bizarre moteur', 'bruit voiture',
    'strange noise', 'weird noise', 'unusual noise', 'noise in car', 'car noise',
    'ma voiture', 'mon vehicule', 'le moteur', 'mon auto', 'my car', 'the car', 'the engine',
    'que faire', 'quoi faire', 'comment faire', 'c est quoi', 'cest quoi', 'qu est ce qui se passe', 'quest ce qui se passe',
    'what to do', 'what should i do', 'how to fix', 'what is happening',
    'je sais pas', 'jsp', 'rien', 'test', 'ok', 'merci', 'non', 'oui', 'svp', 'stp', 'thanks', 'please'
  ]);

  if (vagueExactPhrases.has(normalized)) {
    return true;
  }

  // 2. Gibberish / repetition / random characters (e.g. "aaaaaa", "asdfghjkl", "???")
  if (/^([a-z0-9\W])\1{3,}$/i.test(clean) || /^[^a-zA-Z0-9]+$/.test(clean)) {
    return true;
  }

  // 3. Short inputs (< 40 chars) that only consist of generic conversational words
  const genericWords = new Set([
    'bonjour', 'salut', 'hello', 'voiture', 'vehicule', 'auto', 'moteur', 'panne', 'probleme',
    'souci', 'aide', 'marche', 'fonctionne', 'pas', 'plus', 'fait', 'bruit', 'mon', 'ma', 'mes',
    'un', 'une', 'des', 'le', 'la', 'les', 'cest', 'que', 'quoi', 'comment', 'faire', 'sur', 'dans',
    'avec', 'help', 'car', 'broken', 'issue', 'noise', 'depuis', 'hier', 'temps', 'tout', 'tous',
    'peux', 'peut', 'savoir', 'dire', 'est', 'ai', 'jai', 'svp', 'stp', 'merci', 'bonsoir', 'moi',
    'my', 'the', 'and', 'this', 'that', 'not', 'have', 'has', 'there', 'please', 'with', 'what', 'how'
  ]);
  const words = normalized.split(/\s+/).filter(w => w.length > 1);
  if (clean.length < 40 && words.length > 0) {
    const allGeneric = words.every(w => genericWords.has(w));
    if (allGeneric) return true;
  }

  // 4. Missing mechanical context:
  // Check if message contains at least one technical symptom, part, fluid, warning light, or condition:
  const technicalKeywords = [
    // Symptoms / Sounds / Observations (FR & EN)
    'claqu', 'siffl', 'vibr', 'trembl', 'fumee', 'fume', 'smok', 'odeur', 'odor', 'smell',
    'fuite', 'leak', 'coule', 'goutt', 'drip', 'demarr', 'start', 'cale', 'stall', 'calag',
    'brout', 'rate', 'misfir', 'acoup', 'a-coup', 'hesitat', 'puissanc', 'power', 'perte', 'loss',
    'mou', 'moll', 'spong', 'soft', 'dur', 'hard', 'stiff', 'bloqu', 'stuck', 'chauff', 'overheat',
    'surchauff', 'voyant', 'light', 'temoin', 'clignot', 'blink', 'flash', 'bip', 'alerte',
    'usur', 'worn', 'wear', 'crev', 'flat', 'degonfl', 'spongieux', 'patin', 'slip', 'grinc', 'grind', 'squeak', 'squeal',
    'frott', 'rub', 'cliquet', 'click', 'tick', 'knock', 'rattl',
    // Components (FR & EN)
    'frein', 'brake', 'plaquett', 'pad', 'disqu', 'rotor', 'disc', 'etrier', 'caliper', 'abs', 'esp',
    'culass', 'head gasket', 'soupap', 'valve', 'piston', 'batteri', 'battery', 'alternat',
    'demarreur', 'starter', 'bougi', 'plug', 'bobin', 'coil', 'allumag', 'ignition',
    'embrayag', 'clutch', 'boit', 'gearbox', 'vitess', 'gear', 'transmiss', 'cardan', 'axle', 'driveshaft',
    'soufflet', 'boot', 'direct', 'steer', 'volant', 'wheel', 'cremailler', 'rack', 'rotul', 'tie rod', 'ball joint',
    'suspens', 'amortiss', 'shock', 'strut', 'ressort', 'spring', 'pneu', 'tire', 'tyre',
    'roulement', 'bearing', 'echapp', 'exhaust', 'pot', 'muffler', 'fap', 'dpf', 'catalys', 'catalytic',
    'lambd', 'o2 sensor', 'egr', 'adblue', 'turbo', 'boost', 'inject', 'pompe', 'pump',
    'carbur', 'fuel', 'essenc', 'gas', 'petrol', 'gasoil', 'diesel', 'filtr', 'filter',
    'radiat', 'radiator', 'refroidiss', 'coolant', 'calorstat', 'thermostat', 'durit', 'hose',
    'ventil', 'fan', 'huil', 'oil', 'vidang', 'courroi', 'belt', 'chain', 'distrib', 'timing',
    'accessoir', 'serpentine', 'galet', 'pulley', 'clim', 'ac', 'compress'
  ];

  const hasTechKeyword = technicalKeywords.some(kw => normalized.includes(kw));
  if (!hasTechKeyword) {
    return true;
  }

  // Purely vague noise phrases without context
  if (normalized === 'bruit' || normalized === 'bruit moteur' || normalized === 'un bruit dans le moteur' || normalized === 'moteur fait du bruit' ||
      normalized === 'noise' || normalized === 'engine noise' || normalized === 'car noise' || normalized === 'strange noise') {
    return true;
  }

  return false;
}

// Helper: Build polite clarification request when user input lacks precision
function buildClarificationResponse(vehicle, cleanMessage, language = 'fr') {
  const isEn = language === 'en';
  const vehName = vehicle && vehicle.brand ? `${vehicle.brand} ${vehicle.model || ''}` : (isEn ? 'your vehicle' : 'votre véhicule');
  const vehSpec = isEn
    ? `${vehName} (${vehicle?.engine || 'standard engine'}${vehicle?.mileage ? ', ' + Number(vehicle.mileage).toLocaleString('en-US') + ' km' : ''})`
    : `${vehName} (${vehicle?.engine || 'motorisation standard'}${vehicle?.mileage ? ', ' + Number(vehicle.mileage).toLocaleString('fr-FR') + ' km' : ''})`;

  if (isEn) {
    return `### ⚠️ Details required for your diagnosis

Your description is currently **too vague or incomplete** to establish a reliable mechanical diagnosis.

To prevent misdiagnosis and **avoid giving an inaccurate repair cost estimate**, you need to **provide more specific details about the issue**.

Please specify:
1. **The exact symptom observed:** (e.g. metallic knocking, high-pitched squeal, thick exhaust smoke, steering vibration, hesitation, abnormal odor...)
2. **When it occurs:** (e.g. cold start in the morning, hot engine on highway, while braking, when turning the steering wheel, at idle...)
3. **Dashboard warning lights:** Is any warning light illuminated on the instrument cluster? (amber, red, solid, or flashing?)
4. **Location of the anomaly:** (engine bay, front/rear wheels, underbody exhaust, gearbox...)

As soon as you provide these details, I will give you a targeted diagnostic analysis and realistic repair cost estimate for your **${vehSpec}**.`;
  }

  return `### ⚠️ Précisions nécessaires pour votre diagnostic

Votre description est actuellement **trop vague ou imprécise** pour établir un diagnostic mécanique fiable.

Pour éviter toute erreur d'interprétation et **ne pas vous donner une fausse estimation de coût**, il est indispensable de **préciser les symptômes constatés**.

Merci de m'indiquer :
1. **Le symptôme exact constaté :** (ex. claquement métallique, sifflement aigu, fumée à l'échappement, vibrations au volant, perte de puissance, odeur anormale...)
2. **Le contexte d'apparition :** (ex. au démarrage à froid le matin, moteur chaud sur autoroute, lors du freinage, en braquant les roues, au ralenti...)
3. **Les voyants au tableau de bord :** Un témoin est-il allumé ? (orange, rouge, fixe ou clignotant ?)
4. **La localisation perçue :** (compartiment moteur, roue avant/arrière, sous le châssis, échappement, boîte de vitesses...)

Dès que vous m'aurez apporté ces précisions, je pourrai vous fournir une analyse technique ciblée et une estimation chiffrée adaptée à votre **${vehSpec}**.`;
}

// Helper: Build tailored system prompt based on user vehicle and database context
function buildVehicleSystemPrompt(vehicle, dbContext = '', language = 'fr') {
  const isEn = language === 'en';

  if (isEn) {
    let engVehDesc = 'Not specified (general advice)';
    if (vehicle && vehicle.brand) {
      engVehDesc = `${vehicle.brand} ${vehicle.model || ''} (${vehicle.year || 'Year unspecified'})
- Engine : ${vehicle.engine || 'Standard'} (${vehicle.fuel || 'Not specified'})
- Odometer : ${vehicle.mileage ? Number(vehicle.mileage).toLocaleString('en-US') + ' km' : 'Not specified'}`;
    }

    let prompt = `You are "AutoDiag Copilot", a master automotive technician and workshop diagnostic expert.
You answer car owners' questions with technical precision, clarity, and reassurance, adapted to their specific vehicle.

ACTIVE USER VEHICLE CONTEXT (FROM DATABASE):
${engVehDesc}`;

    if (dbContext && dbContext.trim()) {
      prompt += `\n\nOFFICIAL TECHNICAL DATA RETRIEVED IN REAL-TIME FROM MYSQL AUTODIAG DATABASE:
${dbContext}
(Rule: Use these official technical specifications and figures to back your diagnostic findings, causes, and repair costs!)`;
    }

    prompt += `\n\nCRITICAL RULE #1: VAGUE, IMPRECISE, OR INCOMPLETE USER MESSAGES (STRICT ENFORCEMENT):
If the user's message is vague, imprecise, incomplete, contradictory, erroneous, too short, or simply a greeting (e.g. "hello", "hi", "help me", "my car is broken", "car problem", "there is a noise", "weird noise", "not working", etc.):
1. DO NOT INVENT A DIAGNOSIS AND DO NOT OFFER SPECULATIVE TECHNICAL EXPLANATIONS.
2. DO NOT DISPLAY ANY REPAIR COST ESTIMATES UNDER ANY CIRCUMSTANCES: the section "### 💶 Estimated Cost" MUST NOT BE SHOWN!
3. REPLY CLEARLY BY STATING THAT MORE DETAILS ARE REQUIRED TO ESTABLISH A RELIABLE DIAGNOSIS.
4. Politely ask 3 or 4 targeted questions to help pinpoint the issue (exact noise/symptom, driving conditions, warning lights, location).

OEM WORKSHOP RESPONSE STRUCTURE (ONLY WHEN THE USER DESCRIBES A SPECIFIC, CONCRETE SYMPTOM):
If and only if the user has provided specific, identifiable mechanical symptoms or a fault code, use these 5 distinct markdown sections:

### 🔍 Analysis & Probable Diagnosis
Clearly, calmly, and precisely explain the mechanical phenomenon observed, citing specifically the user's vehicle (${engVehDesc.split('\n')[0]}).

### ⚠️ Urgency Level & Safety
- **Severity:** [Low | Moderate | High | Critical]
- **Can you drive:** [Yes without immediate danger | Caution: short drive to repair shop | Immediate stop imperative]

### 🛠️ Main Causes to Inspect
- **1. [Component 1]:** [Concise description of the fault]
- **2. [Component 2]:** [Concise description of the fault]

### 💡 Recommended Actions & Advice
- **Personal check:** [What the driver can check personally without tools or disassembly]
- **Shop intervention:** [Precise inspection or test to request from the mechanic]

### 💶 Estimated Cost (Parts & Labor)
- **Average estimated range:** [Realistic prices in euros € or local currency, comparing independent shop vs dealership]

Style guidelines: Be direct, airy, avoid massive walls of text, and use bold formatting on technical keywords.

CRITICAL LANGUAGE RULE:
You MUST write your ENTIRE response in ENGLISH. Every title, heading, bullet point, label, explanation, and recommendation MUST be strictly in English. Never use French words.`;

    return prompt;
  }

  // Default: French
  let vehDesc = 'Non renseigné (conseils généralistes)';
  if (vehicle && vehicle.brand) {
    vehDesc = `${vehicle.brand} ${vehicle.model || ''} (${vehicle.year || 'Année non précisée'})
- Motorisation : ${vehicle.engine || 'Standard'} (${vehicle.fuel || 'Non spécifié'})
- Kilométrage compteur : ${vehicle.mileage ? Number(vehicle.mileage).toLocaleString('fr-FR') + ' km' : 'Non précisé'}`;
  }

  let prompt = `Tu es "AutoDiag Copilote", un mécanicien automobile expert, courtois, pédagogue et bienveillant.
Tu réponds aux questions des automobilistes en adaptant précisément tes explications selon le profil et le véhicule de l'utilisateur.

CONTEXTE DU VÉHICULE ACTIF DE L'UTILISATEUR (ISSUS DE LA BASE DE DONNÉES) :
${vehDesc}`;

  if (dbContext && dbContext.trim()) {
    prompt += `\n\nDONNÉES TECHNIQUES EXTRAITES EN TEMPS RÉEL DE LA BASE DE DONNÉES DU PROJET (MYSQL AUTODIAG) :
${dbContext}
(Consigne : Utilise ces données officielles de la base pour appuyer tes explications, tes prix et tes causes probables !)`;
  }

  prompt += `\n\nRÈGLE ABSOLUE #1 : DÉTECTION DES DEMANDES VAGUES, IMPRÉCISES OU ERRONÉES (CRITIQUE OBLIGATOIRE) :
Si le message de l'utilisateur est vague, imprécis, incomplet, erroné, trop court ou constitue une simple salutation (exemples : "bonjour", "aidez-moi", "ma voiture ne marche pas", "j'ai un problème", "ça fait un bruit", "bruit bizarre", "panne", etc.) :
1. N'INVENTE AUCUN DIAGNOSTIC ET N'AFFICHE PAS D'EXPLICATION TECHNIQUE HYPOTHÉTIQUE.
2. N'AFFICHE SOUS AUCUN PRÉTEXTE DE COÛT DE RÉPARATION : la section "### 💶 Estimation Chiffrée" ne doit JAMAIS apparaître !
3. RÉPONDS CLAIREMENT EN INDIQUANT QU'IL FAUT PRÉCISER LA SITUATION.
4. Pose-lui avec bienveillance les 4 questions ciblées suivantes pour pouvoir l'aider :
   - 1. Quel est le symptôme précis (claquement, sifflement, fumée, vibration, trou à l'accélération, odeur...) ?
   - 2. Dans quelles circonstances cela arrive-t-il (au démarrage à froid, à chaud, au freinage, à l'accélération...) ?
   - 3. Un voyant est-il allumé au tableau de bord (couleur orange ou rouge, fixe ou clignotant) ?
   - 4. Vers quel endroit localisez-vous le problème (moteur, roue avant/arrière, boîte de vitesses, échappement...) ?

STRUCTURE DE RÉPONSE D'ATELIER (UNIQUEMENT LORSQUE LE SYMPTÔME EST PRÉCIS OU IDENTIFIÉ) :
Si et seulement si l'utilisateur a fourni une description précise d'un symptôme ou d'une panne automobile réelle, utilise alors les 5 sections markdown professionnelles :

### 🔍 Analyse & Diagnostic Probable
Explique avec clarté, bienveillance et précision le phénomène mécanique constaté, en citant spécifiquement le véhicule de l'utilisateur (${vehDesc.split('\n')[0]}).

### ⚠️ Niveau d'Urgence & Sécurité
- **Gravité :** [Faible | Modérée | Élevée | Critique]
- **Peut-on rouler :** [Oui sans danger immédiat | Vigilance : trajet court vers garage | Arrêt immédiat impératif]

### 🛠️ Causes Principales à Contrôler
- **1. [Composant 1] :** [Description concise du dysfonctionnement]
- **2. [Composant 2] :** [Description concise du dysfonctionnement]

### 💡 Conseils & Actions Recommandées
- **Contrôle personnel :** [Ce que le conducteur peut vérifier lui-même sans démonter]
- **Intervention atelier :** [Les tests ou opérations précis à demander au mécanicien]

### 💶 Estimation Chiffrée (Pièces & Main d'Œuvre)
- **Fourchette moyenne constatée :** [Prix réalistes en euros €, comparaison indépendant vs concession]

Règles de style : sois direct, aéré, évite les pavés de texte indigestes et utilise du gras sur les mots clés techniques.

CONSIGNE DE LANGUE STRICTE ET OBLIGATOIRE :
Tu dois impérativement rédiger l'intégralité de ta réponse en français. Tous les titres, puces, explications et recommandations doivent être en français.`;

  return prompt;
}

// 6. Interactive AI Chat Assistant (Compatible OpenAI / DeepSeek / Groq Gratuit / OpenRouter / Local Fallback)
router.post(['/chat', '/ai/chat'], aiChatLimiter, async (req, res) => {
  try {
    const {
      message,
      vehicle,
      history = [],
      api_key = null,
      provider = null,
      model = null,
      language = 'fr'
    } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message requis et doit être une chaîne de caractères.' });
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length > 500) {
      return res.status(400).json({ error: 'Le message est trop long (maximum 500 caractères autorisés).' });
    }

    // 0. Clarification Guard: if user message is vague, imprecise, erroneous, or lacks technical details
    if (isVagueOrImpreciseMessage(cleanMessage)) {
      const clarificationReply = buildClarificationResponse(vehicle, cleanMessage, language);
      return res.json({
        reply: clarificationReply,
        provider: 'AutoDiag IA (Conseiller Mécanique)',
        model: 'Clarification-Guard',
        vehicle_applied: !!(vehicle && vehicle.brand),
        db_context_applied: false,
        status: 'clarification_needed',
        fallback_applied: false
      });
    }

    const pool = getPool();
    const dbContext = await retrieveDatabaseContext(pool, cleanMessage, vehicle);
    const systemPrompt = buildVehicleSystemPrompt(vehicle, dbContext, language);

    // 1. Resolve API key, Provider, and Base URL
    let resolvedKey = (api_key && api_key.trim()) ||
      process.env.GROQ_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY ||
      null;

    let targetProvider = provider;
    if (!targetProvider) {
      if (resolvedKey && resolvedKey.startsWith('gsk_')) targetProvider = 'groq';
      else if (resolvedKey && resolvedKey.startsWith('sk-or-')) targetProvider = 'openrouter';
      else if (resolvedKey && resolvedKey.startsWith('sk-')) targetProvider = 'deepseek';
      else targetProvider = process.env.AI_PROVIDER || 'groq';
    }

    let resolvedBaseUrl = 'https://api.groq.com/openai/v1';
    let resolvedModel = 'openai/gpt-oss-120b';
    let providerName = 'Groq Cloud (LLM 120B)';

    if (targetProvider === 'deepseek' || (resolvedKey && resolvedKey.startsWith('sk-') && !resolvedKey.startsWith('gsk_') && !resolvedKey.startsWith('sk-or-'))) {
      resolvedBaseUrl = 'https://api.deepseek.com';
      resolvedModel = model || 'deepseek-chat';
      providerName = 'DeepSeek API';
    } else if (targetProvider === 'openrouter' || (resolvedKey && resolvedKey.startsWith('sk-or-'))) {
      resolvedBaseUrl = 'https://openrouter.ai/api/v1';
      resolvedModel = model || 'deepseek/deepseek-r1:free';
      providerName = 'OpenRouter (DeepSeek R1 Free)';
    } else if (targetProvider === 'openai') {
      resolvedBaseUrl = 'https://api.openai.com/v1';
      resolvedModel = model || 'gpt-4o-mini';
      providerName = 'OpenAI (ChatGPT)';
    } else if (targetProvider === 'local') {
      resolvedBaseUrl = process.env.AI_LOCAL_BASE_URL || 'http://127.0.0.1:11434';
      resolvedModel = model || process.env.AI_LOCAL_MODEL || 'qwen2.5:3b';
      providerName = 'IA Locale Qwen2.5';
    } else {
      // Default: Groq Cloud
      resolvedBaseUrl = 'https://api.groq.com/openai/v1';
      resolvedModel = model || (process.env.AI_PROVIDER === 'groq' && process.env.AI_MODEL ? process.env.AI_MODEL : 'openai/gpt-oss-120b');
      providerName = 'Groq Cloud (LLM 120B Gratuit)';
    }

    // 2. Format conversation messages
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // 3. Try Cloud API if key is present
    if (resolvedKey) {
      const isGroq = targetProvider === 'groq' || resolvedBaseUrl.includes('groq.com');
      const candidateModels = isGroq
        ? Array.from(new Set([resolvedModel, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'llama-3.3-70b-versatile']))
        : [resolvedModel];

      for (const currentModel of candidateModels) {
        try {
          const cloudResponse = await fetch(`${resolvedBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resolvedKey}`
            },
            body: JSON.stringify({
              model: currentModel,
              messages: formattedMessages,
              temperature: 0.7,
              max_tokens: 1000
            }),
            signal: AbortSignal.timeout(25000)
          });

          if (cloudResponse.ok) {
            const data = await cloudResponse.json();
            let reply = data.choices && data.choices[0] && (data.choices[0].message?.content || data.choices[0].message?.reasoning);
            if (reply) {
              // Remove DeepSeek-R1 / thinking <think>...</think> tags for clean output
              reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
              return res.json({
                reply,
                provider: providerName,
                model: currentModel,
                vehicle_applied: !!(vehicle && vehicle.brand),
                db_context_applied: !!(dbContext && dbContext.trim()),
                status: 'success',
                fallback_applied: false
              });
            }
          } else {
            const errText = await cloudResponse.text();
            console.warn(`[AI Chat] Cloud API (${currentModel}) returned ${cloudResponse.status}:`, errText);
            // If model is retired or not found on this Groq tier, try next candidate model
            if (cloudResponse.status === 404 && isGroq) {
              continue;
            }
            // If 401 Unauthorized or 403 Forbidden, do not loop other models with same invalid key
            if (cloudResponse.status === 401 || cloudResponse.status === 403) {
              break;
            }
          }
        } catch (cloudErr) {
          console.warn(`[AI Chat] Cloud API attempt (${currentModel}) failed:`, cloudErr.message);
          if (!isGroq) break;
        }
      }
    }

    // 4. Intelligent Local Fallback (adapted to user vehicle & strictly structured)
    const isEn = language === 'en';
    const vehName = vehicle && vehicle.brand ? `${vehicle.brand} ${vehicle.model || ''}` : (isEn ? 'your vehicle' : 'votre véhicule');
    const vehSpec = isEn
      ? `${vehName} (${vehicle?.engine || 'standard engine'}${vehicle?.mileage ? ', ' + Number(vehicle.mileage).toLocaleString('en-US') + ' km' : ''})`
      : `${vehName} (${vehicle?.engine || 'motorisation standard'}${vehicle?.mileage ? ', ' + Number(vehicle.mileage).toLocaleString('fr-FR') + ' km' : ''})`;
    const qLower = message.toLowerCase();
    let fallbackReply = '';

    if (/frein|plaquette|disque|brake|pad|rotor/.test(qLower)) {
      fallbackReply = isEn
        ? `### 🔍 Analysis & Probable Diagnosis
On your **${vehSpec}**, abnormal brake pedal feel (spongy, sinking) or grinding noise when braking typically indicates critical friction pad wear or pressure loss in the hydraulic circuit.

### ⚠️ Urgency Level & Safety
- **Severity:** High
- **Can you drive:** Caution: very short drive to repair shop at reduced speed, immediate stop if pedal goes all the way to the floor.

### 🛠️ Main Causes to Inspect
- **1. Worn Brake Pads:** Friction material worn down to the wear indicator or metal backing plate.
- **2. Low DOT4 Brake Fluid:** Fluid leak on flexible lines, caliper piston seal, or master cylinder failure requiring a bleed.

### 💡 Recommended Actions & Advice
- **Personal check:** Pop the hood and inspect brake fluid reservoir level (must be between MIN and MAX). Check through wheels for pad thickness (> 3 mm).
- **Shop intervention:** Request rotor thickness micrometer check and front brake pads replacement.

### 💶 Estimated Cost (Parts & Labor)
- **Average estimated range:** **80 € to 160 €** for front pads alone, or **220 € to 340 €** for complete rotors + pads package.`
        : `### 🔍 Analyse & Diagnostic Probable
Sur votre **${vehSpec}**, un comportement anormal de la pédale de frein ou des bruits métalliques au ralentissement indiquent généralement une usure critique des garnitures de friction ou une baisse de pression dans le circuit hydraulique.

### ⚠️ Niveau d'Urgence & Sécurité
- **Gravité :** Élevée
- **Peut-on rouler :** Vigilance : trajet court vers garage à allure réduite, arrêt immédiat si la pédale s'enfonce à fond.

### 🛠️ Causes Principales à Contrôler
- **1. Plaquettes de frein usées :** Le témoin d'usure ou le support métallique frotte contre la piste du disque.
- **2. Baisse de liquide DOT4 :** Fuite sur un flexible de frein ou étrier grippé nécessitant purge.

### 💡 Conseils & Actions Recommandées
- **Contrôle personnel :** Ouvrez le capot et inspectez le bocal de liquide de frein (niveau entre MIN et MAX). Regardez à travers les jantes l'épaisseur restante des plaquettes (> 3 mm).
- **Intervention atelier :** Demandez un contrôle de l'épaisseur des disques au palmer et le remplacement du train de plaquettes avant.

### 💶 Estimation Chiffrée (Pièces & Main d'Œuvre)
- **Fourchette moyenne constatée :** **80 € à 160 €** pour les plaquettes avant seules, ou **220 € à 340 €** pour le kit disques + plaquettes monté.`;
    } else if (/courroie|distribution|timing belt|belt/.test(qLower)) {
      const isPuretech = (vehicle?.engine || '').toLowerCase().includes('puretech');
      fallbackReply = isEn
        ? `### 🔍 Analysis & Probable Diagnosis
For your **${vehSpec}**, the timing belt maintains critical synchronization between valves and pistons. Belt failure leads to catastrophic engine destruction.

### ⚠️ Urgency Level & Safety
- **Severity:** High
- **Can you drive:** Yes if no oil pressure warnings or unusual ticking sounds, but strictly adhere to scheduled age/mileage limits.

### 🛠️ Main Causes to Inspect
- **1. Age & Mileage Limit:** ${isPuretech ? 'On the 1.2 PureTech wet timing belt engine, OEM recommendation is **6 years or 100,000 km** with width gauge check at every oil change.' : 'Standard OEM recommendation is **5 to 6 years or 100,000 to 150,000 km** depending on manufacturer.'}
- **2. Water Pump Bearing Wear:** Risk of play or coolant leakage driven by the timing belt.

### 💡 Recommended Actions & Advice
- **Personal check:** Inspect your service logbook to confirm the date and mileage of the last timing service.
- **Shop intervention:** Order a complete timing belt kit replacement (belt + tensioner + idler pulleys + water pump + coolant flush).

### 💶 Estimated Cost (Parts & Labor)
- **Average estimated range:** **450 € to 750 €** at an independent garage (**650 € to 950 €** at official dealership).`
        : `### 🔍 Analyse & Diagnostic Probable
Pour votre **${vehSpec}**, la distribution assure la synchronisation vitale entre les soupapes et les pistons. Une défaillance entraîne la casse moteur instantanée.

### ⚠️ Niveau d'Urgence & Sécurité
- **Gravité :** Élevée
- **Peut-on rouler :** Oui si aucune alerte voyant d'huile ou claquement, mais respectez scrupuleusement l'échéance temporelle.

### 🛠️ Causes Principales à Contrôler
- **1. Échéance kilométrique / âge :** ${isPuretech ? 'Sur le 1.2 PureTech à courroie humide, la préconisation officielle est de **6 ans ou 100 000 km** avec contrôle de la largeur de courroie à chaque vidange.' : 'La préconisation standard est de **5 à 6 ans ou 100 000 à 150 000 km** selon constructeur.'}
- **2. Usure de la pompe à eau :** Risque de jeu ou de fuite sur le roulement entraîné par la courroie.

### 💡 Conseils & Actions Recommandées
- **Contrôle personnel :** Vérifiez votre carnet d'entretien pour retrouver la date et le kilométrage de la dernière intervention.
- **Intervention atelier :** Demandez un forfait kit de distribution complet (courroie + galets tendeurs + pompe à eau + purge liquide de refroidissement).

### 💶 Estimation Chiffrée (Pièces & Main d'Œuvre)
- **Fourchette moyenne constatée :** **450 € à 750 €** chez un garagiste indépendant (**650 € à 950 €** en réseau constructeur).`;
    } else if (/vidange|huile|entretien|oil|service/.test(qLower)) {
      fallbackReply = isEn
        ? `### 🔍 Analysis & Probable Diagnosis
On your **${vehSpec}**, regular oil changes ensure high-pressure hydrodynamic lubrication of turbocharger bearings, cylinder walls, and camshafts.

### ⚠️ Urgency Level & Safety
- **Severity:** Moderate
- **Can you drive:** Yes if oil level is between marks and red oil pressure warning light is OFF.

### 🛠️ Main Causes to Inspect
- **1. Engine Oil Degradation:** Loss of viscosity and soot accumulation (interval exceeded > 1 year or 15,000 km).
- **2. Oil Filter Clogging:** Reduced oil flow rate to upper engine cylinder head components.

### 💡 Recommended Actions & Advice
- **Personal check:** On flat ground with a cold engine, pull the manual dipstick: oil level must be strictly between MIN and MAX.
- **Shop intervention:** Gravity drain, replace oil filter and sump plug washer, reset maintenance interval indicator.

### 💶 Estimated Cost (Parts & Labor)
- **Average estimated range:** **75 € to 140 €** for complete synthetic oil service and OEM filter.`
        : `### 🔍 Analyse & Diagnostic Probable
Sur votre **${vehSpec}**, la vidange régulière garantit la lubrification sous haute pression des paliers de turbo, des cylindres et de l'arbre à cames.

### ⚠️ Niveau d'Urgence & Sécurité
- **Gravité :** Modérée
- **Peut-on rouler :** Oui si le niveau à la jauge est suffisant et le voyant rouge d'huile éteint.

### 🛠️ Causes Principales à Contrôler
- **1. Dégradation de l'huile moteur :** Perte de viscosité et accumulation de suies (dépassement d'intervalle > 1 an ou 15 000 km).
- **2. Colmatage du filtre à huile :** Réduction du débit d'huile vers les parties hautes du moteur.

### 💡 Conseils & Actions Recommandées
- **Contrôle personnel :** Moteur froid sur sol plat, tirez la jauge manuelle : l'huile doit se situer entre les repères MIN et MAX, de teinte dorée à ambrée (noire normale sur diesel).
- **Intervention atelier :** Vidange par gravitation, remplacement systématique du filtre à huile, du joint de carter et remise à zéro de l'indicateur de maintenance.

### 💶 Estimation Chiffrée (Pièces & Main d'Œuvre)
- **Fourchette moyenne constatée :** **75 € à 140 €** pour un forfait vidange + filtre (huile 100% synthèse homologuée constructeur).`;
    } else if (/voyant.*moteur|voyant.*orange|check engine|dtc|warning light/.test(qLower)) {
      const isBlinking = message.toLowerCase().includes('clignot') || message.toLowerCase().includes('blink') || message.toLowerCase().includes('flash');
      fallbackReply = isEn
        ? `### 🔍 Analysis & Probable Diagnosis
The check engine light illuminated on your **${vehSpec}** signals that a Diagnostic Trouble Code (DTC) has been stored in the engine control unit (ECU).

### ⚠️ Urgency Level & Safety
- **Severity:** ${isBlinking ? 'Critical (Risk of catalytic converter destruction)' : 'Moderate to High'}
- **Can you drive:** ${isBlinking ? 'Immediate stop required: do not drive with a flashing light.' : 'Yes cautiously at moderate speed to the nearest repair facility.'}

### 🛠️ Main Causes to Inspect
- **1. Ignition or Fuel Injection Fault:** Cylinder misfire, ignition coils or fouled spark plugs.
- **2. Emissions / O2 Sensor:** Upstream oxygen sensor, EGR valve, or particulate filter restriction.

### 💡 Recommended Actions & Advice
- **Personal check:** Notice whether the engine shudders, runs rough, or enters limp-home mode.
- **Shop intervention:** Complete electronic OBD-II scan to extract DTC codes (P0xxx) and freeze-frame sensor data.

### 💶 Estimated Cost (Parts & Labor)
- **Average estimated range:** **35 € to 65 €** for diagnostic code reading alone (**120 € to 380 €** depending on sensor replacement).`
        : `### 🔍 Analyse & Diagnostic Probable
L'allumage du témoin moteur sur votre **${vehSpec}** indique qu'un code défaut (DTC) a été mémorisé dans le calculateur d'injection (anomalie de combustion, capteur lambda, injection ou dépollution).

### ⚠️ Niveau d'Urgence & Sécurité
- **Gravité :** ${message.toLowerCase().includes('clignot') ? 'Critique (Risque destruction catalyseur)' : 'Modérée à Élevée'}
- **Peut-on rouler :** ${message.toLowerCase().includes('clignot') ? 'Arrêt immédiat requis : ne pas continuer à rouler.' : 'Oui avec modération à allure stabilisée jusqu\'au garage le plus proche.'}

### 🛠️ Causes Principales à Contrôler
- **1. Système d'allumage ou d'injection :** Ratés de combustion, bobines ou bougies encrassées.
- **2. Circuit de dépollution / sonde Lambda :** Sonde O2 amont, vanne EGR ou filtre à particules colmaté.

### 💡 Conseils & Actions Recommandées
- **Contrôle personnel :** Vérifiez si le moteur tremble ou subit une perte de puissance en côte (mode dégradé).
- **Intervention atelier :** Diagnostic électronique complet à la valise OBD-II pour relever les codes DTC (P0xxx) et figer les paramètres en temps réel.

### 💶 Estimation Chiffrée (Pièces & Main d'Œuvre)
- **Fourchette moyenne constatée :** **35 € à 65 €** pour la lecture valise de diagnostic seule (**120 € à 380 €** selon le capteur à remplacer).`;
    } else {
      // If the query does not match any recognized technical fault pattern, ask for precision without inventing a cost
      fallbackReply = buildClarificationResponse(vehicle, cleanMessage, language);
    }

    return res.json({
      reply: fallbackReply,
      provider: 'AutoDiag IA Locale (Mode Hors-Ligne)',
      model: 'Qwen2.5-Offline-Fallback',
      vehicle_applied: !!(vehicle && vehicle.brand),
      db_context_applied: !!(dbContext && dbContext.trim()),
      status: 'success',
      fallback_applied: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

