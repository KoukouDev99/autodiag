const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');
const { appCache } = require('../utils/cache');

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
       VALUES (?, 'Peugeot', '208', 2020, 'Essence', '1.2 PureTech', 45000, 1)`,
      [newId]
    );
    const [created] = await pool.query('SELECT id, name, email, phone, city, created_at FROM users WHERE id = ?', [newId]);
    res.status(201).json({ success: true, user: created[0], token: 'autodiag-jwt-' + newId + '-' + Date.now() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Profile GET
router.get('/auth/profile/:id', async (req, res) => {
  try {
    const pool = getPool();
    const userId = req.params.id;
    const [[rows], [vCount], [dCount]] = await Promise.all([
      pool.query('SELECT id, name, email, phone, city, created_at FROM users WHERE id = ?', [userId]),
      pool.query('SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?', [userId]),
      pool.query('SELECT COUNT(*) as count FROM diagnostic_sessions WHERE user_id = ?', [userId])
    ]);
    if (rows.length === 0) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    const user = rows[0];

    res.json({
      ...user,
      vehicles_count: vCount[0].count,
      diagnostics_count: dCount[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth: Profile PUT
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

// Unified Knowledge Base Status & Architecture
router.get('/kb/unified/summary', async (req, res) => {
  try {
    const cacheKey = 'kb:unified:summary';
    const cached = appCache.get(cacheKey);
    if (cached) return res.json(cached);

    const pool = getPool();
    const [
      [sources],
      [symptoms],
      [faults],
      [faultSymptoms],
      [faultVehicles],
      [questions],
      [options],
      [rules],
      [tests],
      [solutions],
      [sessions]
    ] = await Promise.all([
      pool.query('SELECT * FROM data_sources ORDER BY id ASC'),
      pool.query('SELECT COUNT(*) as count FROM symptoms'),
      pool.query('SELECT COUNT(*) as count FROM faults'),
      pool.query('SELECT COUNT(*) as count FROM fault_symptoms'),
      pool.query('SELECT COUNT(*) as count FROM fault_vehicles'),
      pool.query('SELECT COUNT(*) as count FROM diagnostic_questions'),
      pool.query('SELECT COUNT(*) as count FROM answer_options'),
      pool.query('SELECT COUNT(*) as count FROM diagnostic_rules'),
      pool.query('SELECT COUNT(*) as count FROM diagnostic_tests'),
      pool.query('SELECT COUNT(*) as count FROM solutions'),
      pool.query('SELECT COUNT(*) as count FROM diagnostic_sessions')
    ]);

    const summary = {
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
    };

    appCache.set(cacheKey, summary, 3600); // 1h TTL
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Performance & Cache Metrics
router.get('/system/stats', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    uptime_seconds: Math.floor(process.uptime()),
    cache: appCache.getStats(),
    memory: {
      rss_mb: Math.round(mem.rss / (1024 * 1024)),
      heap_total_mb: Math.round(mem.heapTotal / (1024 * 1024)),
      heap_used_mb: Math.round(mem.heapUsed / (1024 * 1024))
    },
    node_version: process.version
  });
});

// System: Invalidate Cache
router.post('/system/cache/clear', (req, res) => {
  appCache.clear();
  res.json({ success: true, message: 'Application cache cleared' });
});

module.exports = router;
