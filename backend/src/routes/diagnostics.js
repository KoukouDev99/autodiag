const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');
const DiagnosticEngine = require('../services/diagnosticEngine');
const { appCache } = require('../utils/cache');

// Helper: Cached fault_vehicles to avoid repeating full table query on every question/result
async function getFaultVehiclesCached(pool) {
  const cacheKey = 'catalog:fault_vehicles';
  const cached = appCache.get(cacheKey);
  if (cached) return cached;
  const [rows] = await pool.query('SELECT * FROM fault_vehicles');
  appCache.set(cacheKey, rows, 1800); // 30 min TTL
  return rows;
}

// Helper: Get candidate hypotheses (from unified faults + fault_symptoms, fallback to hypotheses)
async function getHypothesesForSymptom(pool, symptomId) {
  const cacheKey = `hypotheses:symptom:${symptomId}`;
  const cached = appCache.get(cacheKey);
  if (cached) return cached;

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
  if (rows.length > 0) {
    appCache.set(cacheKey, rows, 600); // 10 min TTL
    return rows;
  }
  const [legacy] = await pool.query('SELECT * FROM hypotheses WHERE symptom_id = ? ORDER BY order_index ASC', [symptomId]);
  appCache.set(cacheKey, legacy, 600);
  return legacy;
}

// Helper: Get diagnostic questions with options (B2: BATCHED query, NO N+1 loop)
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

    if (rows.length === 0) return [];

    // B2 FIX: Batch fetch all answer_options in ONE single query instead of looping N times
    const qIds = rows.map(q => q.id);
    const [options] = await pool.query(
      `SELECT id, question_id, label as title, subtitle, icon, is_default, order_index
       FROM answer_options
       WHERE question_id IN (${qIds.map(() => '?').join(',')})
       ORDER BY order_index ASC, id ASC`,
      qIds
    );

    const optionsByQ = {};
    for (const opt of options) {
      if (!optionsByQ[opt.question_id]) optionsByQ[opt.question_id] = [];
      optionsByQ[opt.question_id].push(opt);
    }

    for (const q of rows) {
      q.options = optionsByQ[q.id] || [];
    }
    return rows;
  }

  // Legacy fallback (also batched to avoid N+1)
  let sql = 'SELECT * FROM questions WHERE symptom_id = ?';
  const params = [symptomId];
  if (answeredIds.length > 0) {
    sql += ` AND id NOT IN (${answeredIds.map(() => '?').join(',')})`;
    params.push(...answeredIds);
  }
  sql += ' ORDER BY step_num ASC, id ASC';
  const [rows] = await pool.query(sql, params);
  if (rows.length === 0) return [];

  const qIds = rows.map(q => q.id);
  const [options] = await pool.query(
    `SELECT * FROM question_options WHERE question_id IN (${qIds.map(() => '?').join(',')}) ORDER BY id ASC`,
    qIds
  );

  const optionsByQ = {};
  for (const opt of options) {
    if (!optionsByQ[opt.question_id]) optionsByQ[opt.question_id] = [];
    optionsByQ[opt.question_id].push(opt);
  }

  for (const q of rows) {
    q.options = optionsByQ[q.id] || [];
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

// 1. Recent diagnostics
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

// 2. Diagnostic flow: Start session
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

// 3. Diagnostic flow: Get current question (Optimized with Adaptive Contrast & Early Stopping)
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

    // Cached fault_vehicles
    const compatibilities = await getFaultVehiclesCached(pool);

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

    // 4. Fetch all unanswered questions for this symptom with their options (B2: NO N+1)
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

// 4. Diagnostic flow: Submit Answer
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

// 5. Diagnostic flow: Results (matches Screen 4)
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

    // Cached fault_vehicles
    const compatibilities = await getFaultVehiclesCached(pool);

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

// 6. Continuous Learning & User Feedback (verified_cases)
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

// 7. Repair & Inspection Guide
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

module.exports = router;
