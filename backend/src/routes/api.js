const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');
const DiagnosticEngine = require('../services/diagnosticEngine');

// 1. Current user
router.get('/user/current', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name, email, phone, city, created_at FROM users LIMIT 1');
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Login
router.post('/auth/login', async (req, res) => {
  try {
    const pool = getPool();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects. Aucun compte avec cet email.' });
    }
    const user = rows[0];
    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: 'autodiag-jwt-' + safeUser.id + '-' + Date.now() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Register
router.post('/auth/register', async (req, res) => {
  try {
    const pool = getPool();
    const { name, email, password, phone, city } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Le nom, l\'email et le mot de passe sont obligatoires.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cette adresse email.' });
    }
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, city) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, password, phone || '06 12 34 56 78', city || 'Paris']
    );
    const newId = result.insertId;
    await pool.query(
      `INSERT INTO vehicles (user_id, brand, model, year, fuel, engine, mileage, is_primary) 
       VALUES (?, 'Peugeot', '208', 2020, 'Essence', '1.2 PureTech 100 ch', 45000, TRUE)`,
      [newId]
    );
    const [newUsers] = await pool.query('SELECT id, name, email, phone, city, created_at FROM users WHERE id = ?', [newId]);
    res.status(201).json({
      success: true,
      user: newUsers[0],
      token: 'autodiag-jwt-' + newId + '-' + Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Get Profile with vehicle and diag stats
router.get('/auth/profile/:id', async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.params.id;
    const [rows] = await pool.query('SELECT id, name, email, phone, city, created_at FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const user = rows[0];

    const [vCount] = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?', [userId]);
    const [dCount] = await pool.query('SELECT COUNT(*) as count FROM diagnostic_sessions WHERE user_id = ?', [userId]);

    res.json({
      ...user,
      vehicles_count: vCount[0].count,
      diagnostics_count: dCount[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Update Profile
router.put('/auth/profile/:id', async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.params.id;
    const { name, email, phone, city, password } = req.body;
    let query = 'UPDATE users SET name = ?, email = ?, phone = ?, city = ?';
    const params = [name, email, phone, city];
    if (password && password.trim()) {
      query += ', password = ?';
      params.push(password);
    }
    query += ' WHERE id = ?';
    params.push(userId);
    await pool.query(query, params);
    const [updated] = await pool.query('SELECT id, name, email, phone, city, created_at FROM users WHERE id = ?', [userId]);
    res.json({ success: true, user: updated[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM vehicles ORDER BY is_primary DESC, id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/vehicles/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vehicles/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { brand, model, year, fuel, engine, mileage, mileage_unit = 'km', license_plate, plate_country = 'F' } = req.body;
    await pool.query(
      `UPDATE vehicles 
       SET brand = ?, model = ?, year = ?, fuel = ?, engine = ?, mileage = ?, mileage_unit = ?, license_plate = ?, plate_country = ? 
       WHERE id = ?`,
      [brand, model, year, fuel, engine, mileage, mileage_unit, license_plate, plate_country, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/vehicles', async (req, res) => {
  try {
    const pool = getPool();
    const { user_id = 1, brand, model, year, fuel, engine, mileage, mileage_unit = 'km', license_plate, plate_country = 'F', is_primary = false } = req.body;
    
    // Check if this is the first vehicle
    const [existing] = await pool.query('SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?', [user_id]);
    const shouldBePrimary = is_primary || existing[0].count === 0;

    if (shouldBePrimary) {
      await pool.query('UPDATE vehicles SET is_primary = FALSE WHERE user_id = ?', [user_id]);
    }

    const [result] = await pool.query(
      `INSERT INTO vehicles (user_id, brand, model, year, fuel, engine, mileage, mileage_unit, license_plate, plate_country, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, brand, model, year, fuel, engine, mileage || 0, mileage_unit, license_plate || '', plate_country, shouldBePrimary ? 1 : 0]
    );
    const [created] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/vehicles/:id/primary', async (req, res) => {
  try {
    const pool = getPool();
    const id = req.params.id;
    const [found] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (found.length === 0) return res.status(404).json({ error: 'Véhicule non trouvé' });

    const userId = found[0].user_id;
    await pool.query('UPDATE vehicles SET is_primary = FALSE WHERE user_id = ?', [userId]);
    await pool.query('UPDATE vehicles SET is_primary = TRUE WHERE id = ?', [id]);
    const [updated] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/vehicles/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = req.params.id;
    const [found] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (found.length === 0) return res.status(404).json({ error: 'Véhicule non trouvé' });

    const vehicle = found[0];
    await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);

    // If it was primary, assign primary to another vehicle of this user
    if (vehicle.is_primary) {
      const [remaining] = await pool.query('SELECT id FROM vehicles WHERE user_id = ? ORDER BY id ASC LIMIT 1', [vehicle.user_id]);
      if (remaining.length > 0) {
        await pool.query('UPDATE vehicles SET is_primary = TRUE WHERE id = ?', [remaining[0].id]);
      }
    }
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2b. Car Catalog (Makes, Models, Production Years)
router.get('/catalog/makes', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT DISTINCT make FROM car_catalog ORDER BY make ASC');
    const makes = rows.map(r => r.make);
    res.json(makes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/models', async (req, res) => {
  try {
    const pool = getPool();
    const { make } = req.query;
    if (!make) {
      return res.status(400).json({ error: 'Le paramètre make est obligatoire' });
    }
    const [rows] = await pool.query(
      'SELECT id, model, year_start, year_end FROM car_catalog WHERE make = ? ORDER BY model ASC',
      [make]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/years', async (req, res) => {
  try {
    const pool = getPool();
    const { make, model } = req.query;
    if (!make || !model) {
      return res.status(400).json({ error: 'Les paramètres make et model sont obligatoires' });
    }
    const [rows] = await pool.query(
      'SELECT year_start, year_end FROM car_catalog WHERE make = ? AND model = ? LIMIT 1',
      [make, model]
    );
    if (rows.length === 0) {
      return res.json([]);
    }
    const currentYear = new Date().getFullYear();
    const start = rows[0].year_start || 1990;
    const end = rows[0].year_end || currentYear;
    const years = [];
    for (let y = Math.min(end, currentYear + 1); y >= Math.max(start, 1950); y--) {
      years.push(y);
    }
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/engines', async (req, res) => {
  try {
    const pool = getPool();
    const { make, model, year } = req.query;
    if (!make) {
      return res.status(400).json({ error: 'Le paramètre make est obligatoire' });
    }

    let query = `
      SELECT id, name, power_hp, power_kw, torque_nm, displacement, cylinders,
             fuel, gearbox, drive_type, top_speed, acceleration, dimensions, weight, tires
      FROM car_specs_engines
      WHERE brand_name LIKE ?
    `;
    const params = [`%${make}%`];

    if (model) {
      // Split multi-word models like "208" or "Clio"
      const cleanModel = model.replace(/[-_]/g, ' ').trim();
      const firstWord = cleanModel.split(' ')[0];
      query += ` AND (model_family LIKE ? OR name LIKE ? OR model_family LIKE ?)`;
      params.push(`%${cleanModel}%`, `%${firstWord}%`, `%${firstWord}%`);
    }

    query += ` ORDER BY name ASC LIMIT 60`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/engine-details/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM car_specs_engines WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Moteur non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Symptoms
router.get('/symptoms', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM symptoms ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// IA #1: Semantic Symptom Normalization (FastAPI microservice proxy + deterministic fallback)
router.post('/normalize-symptom', async (req, res) => {
  try {
    const { text, threshold = 0.6, top_k = 3 } = req.body;
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

  // 2. Deterministic Fallback: return original question (requirement: si LLM échoue, retourner la question originale)
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

  // 1. Try local FastAPI microservice (port 8001 or AI_SERVICE_URL)
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

  // 2. Deterministic Fallback: SQL search in faults
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

  // 1. Try local FastAPI microservice (port 8001 or AI_SERVICE_URL)
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

  // 2. Deterministic Fallback: Enforce the 4 mandatory sections and strict cap confidence <= 95
  const name = fault_name || 'Défaut mécanique';
  const whatIsHappening = `Votre véhicule rencontre un dysfonctionnement technique lié à : ${name.toLowerCase()}.`;
  const probableCause = `L'usure naturelle ou les contraintes de fonctionnement empêchent le bon fonctionnement du composant concerné.`;
  const whatToDo = `1. Contrôle visuel préliminaire sans démontage (Gratuit / 0€).\n2. Remplacement ou réparation de la pièce défaillante (estimation 80€ à 250€).\n3. Passage à la valise électronique en atelier si le problème persiste.`;
  const warning = `En cas d'odeur anormale, de fumée, de voyant rouge allumé ou de comportement dangereux du véhicule, arrêtez immédiatement le véhicule et contactez un dépanneur.`;
  
  const confidence = Math.min(88, 95); // Strict cap <= 95%

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

// 4. Recent diagnostics
router.get('/diagnostics/recent', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT d.*, s.label as symptom_label, s.code as symptom_code, s.icon as symptom_icon,
              v.brand as vehicle_brand, v.model as vehicle_model, v.year as vehicle_year
       FROM diagnostic_sessions d
       JOIN symptoms s ON d.symptom_id = s.id
       JOIN vehicles v ON d.vehicle_id = v.id
       ORDER BY d.created_at DESC
       LIMIT 5`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Get candidate hypotheses (from unified faults + fault_symptoms, fallback to hypotheses)
async function getHypothesesForSymptom(pool, symptomId) {
  const [rows] = await pool.query(
    `SELECT f.id, fs.symptom_id, f.name, f.code as fault_code, f.normalized_name,
            f.description, f.gravity_label as gravity, f.cost_min, f.cost_max, f.is_danger,
            fs.relevance_score, fs.is_primary,
            CASE WHEN fs.is_primary = 1 THEN 'PRIORITÉ 1' ELSE 'PRIORITÉ 2' END as priority_badge,
            CASE WHEN fs.is_primary = 1 THEN 'Piste principale' ELSE 'À envisager' END as priority_label,
            ROW_NUMBER() OVER (ORDER BY fs.relevance_score DESC, f.id ASC) as order_index,
            dt.instruction as check_action, dt.test_type as check_type, dt.title as test_title
     FROM faults f
     JOIN fault_symptoms fs ON f.id = fs.fault_id
     LEFT JOIN diagnostic_tests dt ON f.id = dt.fault_id
     WHERE fs.symptom_id = ?
     ORDER BY fs.relevance_score DESC, fs.is_primary DESC, f.id ASC`,
    [symptomId]
  );
  if (rows.length > 0) return rows;
  const [legacy] = await pool.query('SELECT * FROM hypotheses WHERE symptom_id = ? ORDER BY order_index ASC', [symptomId]);
  return legacy;
}

// Helper: Get diagnostic questions with options (prioritizing unified diagnostic_questions & answer_options)
async function getQuestionsForSymptom(pool, symptomId, answeredIds = []) {
  const [diagCount] = await pool.query('SELECT COUNT(*) as count FROM diagnostic_questions WHERE symptom_id = ?', [symptomId]);
  if (diagCount[0].count > 0) {
    let sql = `SELECT id, symptom_id, step_num, category, title, description, why_ask, image_url, reformulation, test_action, test_type
               FROM diagnostic_questions WHERE symptom_id = ?`;
    const params = [symptomId];
    if (answeredIds.length > 0) {
      sql += ` AND id NOT IN (${answeredIds.map(() => '?').join(',')})`;
      params.push(...answeredIds);
    }
    sql += ' ORDER BY step_num ASC, id ASC';
    const [rows] = await pool.query(sql, params);
    for (const q of rows) {
      const [options] = await pool.query(
        `SELECT id, question_id, label as title, subtitle, icon, is_default, order_index
         FROM answer_options
         WHERE question_id = ?
         ORDER BY order_index ASC, id ASC`,
        [q.id]
      );
      q.options = options;
    }
    return rows;
  }

  // Legacy fallback
  let sql = 'SELECT * FROM questions WHERE symptom_id = ?';
  const params = [symptomId];
  if (answeredIds.length > 0) {
    sql += ` AND id NOT IN (${answeredIds.map(() => '?').join(',')})`;
    params.push(...answeredIds);
  }
  sql += ' ORDER BY step_num ASC, id ASC';
  const [rows] = await pool.query(sql, params);
  for (const q of rows) {
    const [options] = await pool.query(
      'SELECT * FROM question_options WHERE question_id = ? ORDER BY id ASC',
      [q.id]
    );
    q.options = options;
  }
  return rows;
}

// Helper: Get session answers joining both answer_options and question_options
async function getAnswersForSession(pool, sessionId) {
  const [rows] = await pool.query(
    `SELECT sa.session_id, sa.question_id, sa.option_id,
            COALESCE(ao.label, qo.title, 'Option sélectionnée') as option_title,
            qo.hypothesis_weights
     FROM session_answers sa
     LEFT JOIN answer_options ao ON sa.option_id = ao.id
     LEFT JOIN question_options qo ON sa.option_id = qo.id
     WHERE sa.session_id = ?`,
    [sessionId]
  );
  return rows;
}

// 5. Diagnostic flow: Start session
router.post('/diagnostic/start', async (req, res) => {
  try {
    const pool = getPool();
    const { symptom_id = 1, vehicle_id = 1, user_id = 1 } = req.body;

    // Get symptom
    const [sympRows] = await pool.query('SELECT * FROM symptoms WHERE id = ? OR code = ?', [symptom_id, symptom_id]);
    if (sympRows.length === 0) return res.status(404).json({ error: 'Symptom not found' });
    const symptom = sympRows[0];

    // Verify vehicle exists or fallback to existing vehicle
    let targetVehicleId = vehicle_id;
    const [vCheck] = await pool.query('SELECT id FROM vehicles WHERE id = ?', [targetVehicleId]);
    if (vCheck.length === 0) {
      const [vFall] = await pool.query('SELECT id FROM vehicles ORDER BY is_primary DESC, id ASC LIMIT 1');
      if (vFall.length > 0) {
        targetVehicleId = vFall[0].id;
      } else {
        const [newV] = await pool.query(
          `INSERT INTO vehicles (user_id, brand, model, year, fuel, engine, mileage, is_primary)
           VALUES (?, 'Peugeot', '208', 2020, 'Essence', '1.2 PureTech', 45000, 1)`,
          [user_id]
        );
        targetVehicleId = newV.insertId;
      }
    }

    // Create session
    const [sessionResult] = await pool.query(
      `INSERT INTO diagnostic_sessions (user_id, vehicle_id, symptom_id, status, current_step, summary_title, summary_desc)
       VALUES (?, ?, ?, 'in_progress', 1, ?, ?)`,
      [user_id, targetVehicleId, symptom.id, symptom.label, 'Diagnostic en cours']
    );
    const sessionId = sessionResult.insertId;

    // Get first question (unified diagnostic_questions or fallback)
    const questions = await getQuestionsForSymptom(pool, symptom.id);
    const currentQuestion = questions.length > 0 ? questions[0] : null;

    // Vehicle details
    const [vRows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [targetVehicleId]);

    res.json({
      session_id: sessionId,
      symptom,
      vehicle: vRows[0],
      current_question: currentQuestion
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Diagnostic flow: Get current question (Optimized with Adaptive Contrast & Early Stopping)
router.get('/diagnostic/:sessionId/question', async (req, res) => {
  try {
    const pool = getPool();
    const { sessionId } = req.params;

    const [sessionRows] = await pool.query(
      `SELECT d.*, s.code as symptom_code, s.label as symptom_label,
              v.brand as vehicle_brand, v.model as vehicle_model, v.year as vehicle_year,
              v.fuel as vehicle_fuel, v.mileage as vehicle_mileage
       FROM diagnostic_sessions d
       JOIN symptoms s ON d.symptom_id = s.id
       JOIN vehicles v ON d.vehicle_id = v.id
       WHERE d.id = ?`,
      [sessionId]
    );

    if (sessionRows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = sessionRows[0];

    // If session is already completed, return immediately
    if (session.status === 'completed') {
      return res.json({ completed: true, session });
    }

    // 1. Fetch answered questions with selected options
    const answers = await getAnswersForSession(pool, sessionId);
    const answeredIds = answers.map(a => a.question_id);
    const optionIds = answers.map(a => a.option_id);

    // 1b. Fetch deterministic diagnostic rules for chosen options
    let rules = [];
    let lastAnswerRules = [];
    if (optionIds.length > 0) {
      const [ruleRows] = await pool.query(
        `SELECT dr.*, ao.label as option_title 
         FROM diagnostic_rules dr
         LEFT JOIN answer_options ao ON dr.answer_option_id = ao.id
         WHERE dr.answer_option_id IN (${optionIds.map(() => '?').join(',')})`,
        optionIds
      );
      rules = ruleRows;
      const lastOptId = optionIds[optionIds.length - 1];
      lastAnswerRules = rules.filter(r => r.answer_option_id === lastOptId);
    }

    const [compatibilities] = await pool.query('SELECT * FROM fault_vehicles');

    // 2. Fetch all hypotheses/faults for this symptom
    const hypotheses = await getHypothesesForSymptom(pool, session.symptom_id);

    const vehicle = {
      brand: session.vehicle_brand,
      model: session.vehicle_model,
      year: session.vehicle_year,
      fuel: session.vehicle_fuel,
      mileage: session.vehicle_mileage
    };

    // 3. Evaluate current hypothesis scores & confidence with deterministic rules
    const evalResult = DiagnosticEngine.evaluate(hypotheses, answers, vehicle, rules, compatibilities);

    // 4. Fetch all unanswered questions for this symptom with their options
    const unansweredQuestions = await getQuestionsForSymptom(pool, session.symptom_id, answeredIds);

    // 5. Select next question using Rule Branching, Information Gain & Early Stopping
    const selection = DiagnosticEngine.selectNextQuestion(unansweredQuestions, evalResult, answers.length, lastAnswerRules);

    if (selection.shouldStopEarly || !selection.selectedQuestion) {
      // Mark session as completed
      await pool.query('UPDATE diagnostic_sessions SET status = "completed", completed_at = NOW() WHERE id = ?', [sessionId]);
      return res.json({
        completed: true,
        session,
        early_stopping: selection.reason === 'high_confidence_reached',
        reason: selection.reason
      });
    }

    const question = selection.selectedQuestion;
    const currentStep = answers.length + 1;
    const totalSteps = Math.max(currentStep, Math.min(answers.length + unansweredQuestions.length, 4));

    res.json({
      completed: false,
      session,
      current_confidence: evalResult.top_confidence,
      top_candidate: evalResult.top_hypothesis?.name,
      eliminated_count: (evalResult.eliminated_hypotheses || []).length,
      question: {
        ...question,
        step_num: currentStep,
        total_steps: totalSteps
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Diagnostic flow: Submit Answer
router.post('/diagnostic/:sessionId/answer', async (req, res) => {
  try {
    const pool = getPool();
    const { sessionId } = req.params;
    const { question_id, option_id } = req.body;

    // Record answer
    await pool.query(
      `INSERT INTO session_answers (session_id, question_id, option_id) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE option_id = VALUES(option_id)`,
      [sessionId, question_id, option_id]
    );

    // Update session current step
    await pool.query(
      'UPDATE diagnostic_sessions SET current_step = current_step + 1 WHERE id = ?',
      [sessionId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Diagnostic flow: Results (matches Screen 4)
router.get('/diagnostic/:sessionId/results', async (req, res) => {
  try {
    const pool = getPool();
    const { sessionId } = req.params;

    const [sessionRows] = await pool.query(
      `SELECT d.*, s.code as symptom_code, s.label as symptom_label,
              v.id as v_id, v.brand as vehicle_brand, v.model as vehicle_model, 
              v.year as vehicle_year, v.fuel as vehicle_fuel, v.engine as vehicle_engine, v.mileage as vehicle_mileage
       FROM diagnostic_sessions d
       JOIN symptoms s ON d.symptom_id = s.id
       JOIN vehicles v ON d.vehicle_id = v.id
       WHERE d.id = ?`,
      [sessionId]
    );

    if (sessionRows.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = sessionRows[0];

    // Get all hypotheses/faults for this symptom
    const hypotheses = await getHypothesesForSymptom(pool, session.symptom_id);

    // Get answers submitted
    const answers = await getAnswersForSession(pool, sessionId);
    const optionIds = answers.map(a => a.option_id);

    let rules = [];
    if (optionIds.length > 0) {
      const [ruleRows] = await pool.query(
        `SELECT dr.*, ao.label as option_title 
         FROM diagnostic_rules dr
         LEFT JOIN answer_options ao ON dr.answer_option_id = ao.id
         WHERE dr.answer_option_id IN (${optionIds.map(() => '?').join(',')})`,
        optionIds
      );
      rules = ruleRows;
    }

    const [compatibilities] = await pool.query('SELECT * FROM fault_vehicles');

    const vehicle = {
      brand: session.vehicle_brand,
      model: session.vehicle_model,
      year: session.vehicle_year,
      mileage: session.vehicle_mileage,
      fuel: session.vehicle_fuel,
      engine: session.vehicle_engine
    };

    // Calculate ranking with deterministic rule engine
    const evalResult = DiagnosticEngine.evaluate(hypotheses, answers, vehicle, rules, compatibilities);
    const rankedHypotheses = evalResult.hypotheses;
    const safetyAlerts = DiagnosticEngine.checkSafety({ code: session.symptom_code }, answers);

    // Provide default repair guide ID for the top hypothesis
    const topHypothesis = evalResult.top_hypothesis || rankedHypotheses[0];
    let guideId = null;
    let structuredTest = evalResult.confirmation_test;
    let structuredSolution = null;

    if (topHypothesis) {
      const [guides] = await pool.query('SELECT id FROM repair_guides WHERE hypothesis_id = ? LIMIT 1', [topHypothesis.id]);
      if (guides.length > 0) guideId = guides[0].id;

      // Try fetching from diagnostic_tests and solutions
      const [tests] = await pool.query('SELECT * FROM diagnostic_tests WHERE fault_id = ? LIMIT 1', [topHypothesis.id]);
      if (tests.length > 0) {
        structuredTest = {
          title: tests[0].title,
          action: tests[0].instruction,
          expected: tests[0].expected_result,
          tools: tests[0].tools_needed
        };
      }

      const [sols] = await pool.query('SELECT * FROM solutions WHERE fault_id = ? LIMIT 1', [topHypothesis.id]);
      if (sols.length > 0) {
        structuredSolution = sols[0];
      }
    }

    // Dynamic headline based on level
    let headline = `Panne la plus probable : ${topHypothesis?.name || 'Inconnue'} (confiance ${evalResult.top_confidence}%).`;
    if (evalResult.output_level === 1) {
      headline = `${topHypothesis?.name || 'Panne identifiée'} — Confiance élevée (${evalResult.top_confidence}%)`;
    } else if (evalResult.output_level === 3) {
      headline = `Diagnostic à confirmer : 3 causes possibles identifiées (confiance ${evalResult.top_confidence}%)`;
    }

    res.json({
      session,
      vehicle,
      symptom: {
        code: session.symptom_code,
        label: session.symptom_label
      },
      summary: {
        headline,
        detail: `Niveau de certitude : ${evalResult.level_title} (${evalResult.top_confidence}%)`
      },
      disclaimer: 'Des hypothèses basées sur vos observations, pas une certitude absolue. Sans mesure physique ni examen en atelier, ces pistes guident vos vérifications sans remplacer un professionnel.',
      causes_count: rankedHypotheses.length,
      hypotheses: rankedHypotheses,
      top_hypothesis: topHypothesis,
      eliminated_hypotheses: evalResult.eliminated_hypotheses || [],
      output_level: evalResult.output_level,
      level_title: evalResult.level_title,
      level_badge: evalResult.level_badge,
      top_confidence: evalResult.top_confidence,
      confirmation_test: structuredTest,
      solution: structuredSolution,
      garage_memo: evalResult.garage_memo,
      safety_alerts: safetyAlerts,
      guide_id: guideId || 1
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8b. Continuous Learning & User Feedback (Section 10 - verified_cases)
router.post('/diagnostic/:sessionId/feedback', async (req, res) => {
  try {
    const pool = getPool();
    const { sessionId } = req.params;
    const { was_correct = true, confirmed_fault_id, feedback_notes, confidence_initial } = req.body;

    const [sessions] = await pool.query('SELECT * FROM diagnostic_sessions WHERE id = ?', [sessionId]);
    if (sessions.length === 0) return res.status(404).json({ error: 'Session non trouvée' });
    const session = sessions[0];

    const [answers] = await pool.query('SELECT question_id, option_id FROM session_answers WHERE session_id = ?', [sessionId]);

    await pool.query(`
      INSERT INTO verified_cases (session_id, confirmed_fault_id, was_correct, user_feedback, feedback_notes, symptoms_json, vehicle_id, confidence_initial)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sessionId,
      confirmed_fault_id || null,
      was_correct ? 1 : 0,
      was_correct ? 'confirmed' : 'disproved',
      feedback_notes || '',
      JSON.stringify(answers),
      session.vehicle_id,
      confidence_initial || 85.0
    ]);

    res.json({
      success: true,
      message: 'Merci pour votre retour ! Votre confirmation permet d\'affiner les règles de diagnostic pour l\'ensemble des conducteurs.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Repair & Inspection Guide (matches Screen 5)
router.get('/diagnostic/guide/:hypothesisId', async (req, res) => {
  try {
    const pool = getPool();
    const { hypothesisId } = req.params;

    const [guides] = await pool.query(
      `SELECT rg.*, h.name as hypothesis_name, s.label as symptom_label,
              v.brand as vehicle_brand, v.model as vehicle_model
       FROM repair_guides rg
       JOIN hypotheses h ON rg.hypothesis_id = h.id
       JOIN symptoms s ON h.symptom_id = s.id
       LEFT JOIN vehicles v ON v.is_primary = TRUE
       WHERE rg.hypothesis_id = ? OR rg.id = ?
       LIMIT 1`,
      [hypothesisId, hypothesisId]
    );

    if (guides.length === 0) return res.status(404).json({ error: 'Guide not found' });
    const guide = guides[0];

    // Fetch steps
    const [steps] = await pool.query(
      'SELECT * FROM repair_steps WHERE guide_id = ? ORDER BY step_num ASC',
      [guide.id]
    );

    let tools = [];
    try {
      tools = typeof guide.tools_needed === 'string' ? JSON.parse(guide.tools_needed) : (guide.tools_needed || []);
    } catch (e) {
      tools = ['Lampe de poche', 'Notice du véhicule'];
    }

    res.json({
      ...guide,
      tools_needed: tools,
      steps
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. DTC Lookup & Search (Wal33D/dtc-database Engine)
router.get('/dtc/search', async (req, res) => {
  try {
    const pool = getPool();
    const { q, type, make, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM dtc_codes WHERE 1=1';
    const params = [];

    if (q) {
      const cleanQ = q.trim();
      sql += ' AND (code LIKE ? OR title LIKE ? OR description LIKE ?)';
      params.push(`${cleanQ}%`, `%${cleanQ}%`, `%${cleanQ}%`);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type.toUpperCase());
    }

    if (make) {
      sql += ' AND (manufacturers LIKE ? OR is_generic = 1)';
      params.push(`%"${make.toUpperCase()}"%`);
    }

    sql += ' ORDER BY code ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 50, parseInt(offset, 10) || 0);

    const [rows] = await pool.query(sql, params);

    const results = rows.map(r => {
      let specificDefs = {};
      try {
        specificDefs = typeof r.specific_definitions === 'string' ? JSON.parse(r.specific_definitions) : (r.specific_definitions || {});
      } catch (_) {}

      let causes = [];
      try {
        causes = typeof r.possible_causes === 'string' ? JSON.parse(r.possible_causes) : (r.possible_causes || []);
      } catch (_) {}

      let mfrs = [];
      try {
        mfrs = typeof r.manufacturers === 'string' ? JSON.parse(r.manufacturers) : (r.manufacturers || []);
      } catch (_) {}

      // If a make was requested, check for brand-specific wording
      let activeDesc = r.description;
      let brandOverride = false;
      if (make && specificDefs[make.toUpperCase()]) {
        activeDesc = specificDefs[make.toUpperCase()];
        brandOverride = true;
      }

      return {
        ...r,
        description: activeDesc,
        base_description: r.description,
        is_brand_override: brandOverride,
        manufacturers: mfrs,
        specific_definitions: specificDefs,
        possible_causes: causes
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dtc/stats', async (req, res) => {
  try {
    const pool = getPool();
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM dtc_codes');
    const [typeRows] = await pool.query('SELECT type, COUNT(*) as count FROM dtc_codes GROUP BY type ORDER BY count DESC');
    const [genericRows] = await pool.query('SELECT is_generic, COUNT(*) as count FROM dtc_codes GROUP BY is_generic');
    
    res.json({
      total_unique_codes: totalRows[0].total,
      breakdown_by_type: typeRows,
      generic_vs_manufacturer: genericRows,
      supported_manufacturers_count: 33,
      standards: 'SAE J2012 / ISO 15031-6'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dtc/:code', async (req, res) => {
  try {
    const pool = getPool();
    const code = req.params.code.trim().toUpperCase();
    const make = req.query.make ? req.query.make.trim().toUpperCase() : null;

    const [rows] = await pool.query('SELECT * FROM dtc_codes WHERE code = ?', [code]);
    if (rows.length === 0) return res.status(404).json({ error: `DTC Code ${code} non trouvé dans la base de données.` });
    
    const row = rows[0];
    let possibleCauses = [];
    try {
      possibleCauses = typeof row.possible_causes === 'string' ? JSON.parse(row.possible_causes) : (row.possible_causes || []);
    } catch (_) {}

    let specificDefs = {};
    try {
      specificDefs = typeof row.specific_definitions === 'string' ? JSON.parse(row.specific_definitions) : (row.specific_definitions || {});
    } catch (_) {}

    let mfrs = [];
    try {
      mfrs = typeof row.manufacturers === 'string' ? JSON.parse(row.manufacturers) : (row.manufacturers || []);
    } catch (_) {}

    let activeDescription = row.description;
    let isBrandSpecific = false;
    let brandMatched = null;

    if (make && specificDefs[make]) {
      activeDescription = specificDefs[make];
      isBrandSpecific = true;
      brandMatched = make;
    }

    let repairInfo = null;
    try {
      repairInfo = typeof row.repair_info === 'string' ? JSON.parse(row.repair_info) : (row.repair_info || null);
    } catch (_) {}

    let flags = null;
    try {
      flags = typeof row.flags === 'string' ? JSON.parse(row.flags) : (row.flags || null);
    } catch (_) {}

    let affectedComponents = [];
    try {
      affectedComponents = typeof row.affected_components === 'string' ? JSON.parse(row.affected_components) : (row.affected_components || []);
    } catch (_) {}

    let symptomsList = [];
    try {
      symptomsList = typeof row.symptoms === 'string' ? JSON.parse(row.symptoms) : (row.symptoms || []);
    } catch (_) {}

    let relatedCodes = [];
    try {
      relatedCodes = typeof row.related_codes === 'string' ? JSON.parse(row.related_codes) : (row.related_codes || []);
    } catch (_) {}

    let bilingualTitle = null;
    try {
      bilingualTitle = typeof row.bilingual_title === 'string' ? JSON.parse(row.bilingual_title) : (row.bilingual_title || null);
    } catch (_) {}

    res.json({
      ...row,
      description: activeDescription,
      base_description: row.description,
      is_brand_specific_definition: isBrandSpecific,
      matched_manufacturer: brandMatched,
      manufacturers: mfrs,
      specific_definitions: specificDefs,
      possible_causes: possibleCauses,
      repair_info: repairInfo,
      flags,
      affected_components: affectedComponents,
      symptoms: symptomsList,
      related_codes: relatedCodes,
      bilingual_title: bilingualTitle
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10b. OBD-II Live Data PIDs (Mode 01 & Mode 09)
router.get('/pids', async (req, res) => {
  try {
    const pool = getPool();
    const { mode } = req.query;
    let sql = 'SELECT * FROM obd_pids';
    const params = [];
    if (mode) {
      sql += ' WHERE mode = ?';
      params.push(mode);
    }
    sql += ' ORDER BY mode ASC, pid ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pids/:mode/:pid', async (req, res) => {
  try {
    const pool = getPool();
    const { mode, pid } = req.params;
    const [rows] = await pool.query('SELECT * FROM obd_pids WHERE mode = ? AND pid = ?', [mode, pid.toUpperCase()]);
    if (rows.length === 0) return res.status(404).json({ error: `PID ${pid} (Mode ${mode}) non trouvé` });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// 11. Maintenance history
router.get('/maintenance/:vehicleId', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM maintenance_records WHERE vehicle_id = ? ORDER BY service_date DESC',
      [req.params.vehicleId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Knowledge Base (Structured Automotive Diagnostics)
router.get('/kb/categories', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT category_id, category, icon, COUNT(*) as count 
      FROM diagnostic_kb 
      GROUP BY category_id, category, icon 
      ORDER BY category ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kb/diagnostics', async (req, res) => {
  try {
    const pool = getPool();
    const { category, query } = req.query;
    let sql = 'SELECT * FROM diagnostic_kb WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND (category_id = ? OR category = ?)';
      params.push(category, category);
    }

    if (query) {
      sql += ' AND (subcategory LIKE ? OR category LIKE ? OR symptoms LIKE ?)';
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
    }

    sql += ' ORDER BY category ASC, subcategory ASC';
    const [rows] = await pool.query(sql, params);
    
    // Parse JSON fields safely
    const parsed = rows.map(r => ({
      ...r,
      symptoms: typeof r.symptoms === 'string' ? JSON.parse(r.symptoms) : r.symptoms,
      diagnosis_steps: typeof r.diagnosis_steps === 'string' ? JSON.parse(r.diagnosis_steps) : r.diagnosis_steps,
      repair_guide: typeof r.repair_guide === 'string' ? JSON.parse(r.repair_guide) : r.repair_guide
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kb/diagnostics/:id', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM diagnostic_kb WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Diagnostic item not found' });
    
    const item = rows[0];
    res.json({
      ...item,
      symptoms: typeof item.symptoms === 'string' ? JSON.parse(item.symptoms) : item.symptoms,
      diagnosis_steps: typeof item.diagnosis_steps === 'string' ? JSON.parse(item.diagnosis_steps) : item.diagnosis_steps,
      repair_guide: typeof item.repair_guide === 'string' ? JSON.parse(item.repair_guide) : item.repair_guide
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Unified Knowledge Base Status & Architecture
router.get('/kb/unified/summary', async (req, res) => {
  try {
    const pool = getPool();
    const [sources] = await pool.query('SELECT * FROM data_sources ORDER BY id ASC');
    const [symptoms] = await pool.query('SELECT COUNT(*) as count FROM symptoms');
    const [faults] = await pool.query('SELECT COUNT(*) as count FROM faults');
    const [faultSymptoms] = await pool.query('SELECT COUNT(*) as count FROM fault_symptoms');
    const [faultVehicles] = await pool.query('SELECT COUNT(*) as count FROM fault_vehicles');
    const [questions] = await pool.query('SELECT COUNT(*) as count FROM diagnostic_questions');
    const [options] = await pool.query('SELECT COUNT(*) as count FROM answer_options');
    const [rules] = await pool.query('SELECT COUNT(*) as count FROM diagnostic_rules');
    const [tests] = await pool.query('SELECT COUNT(*) as count FROM diagnostic_tests');
    const [solutions] = await pool.query('SELECT COUNT(*) as count FROM solutions');
    const [sessions] = await pool.query('SELECT COUNT(*) as count FROM diagnostic_sessions');

    res.json({
      architecture: 'Unified Automotive Diagnostic Knowledge Base & Deterministic Elimination Engine',
      database: 'MySQL autodiag',
      statistics: {
        data_sources_count: sources.length,
        normalized_symptoms_count: symptoms[0].count,
        master_faults_count: faults[0].count,
        fault_symptom_links_count: faultSymptoms[0].count,
        vehicle_compatibilities_count: faultVehicles[0].count,
        diagnostic_questions_count: questions[0].count,
        answer_options_count: options[0].count,
        deterministic_rules_count: rules[0].count,
        sensory_tests_count: tests[0].count,
        repair_solutions_count: solutions[0].count,
        diagnostic_sessions_count: sessions[0].count
      },
      sources: sources.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        type: s.source_type,
        license: s.license,
        version: s.version,
        description: s.description,
        url: s.source_url
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


