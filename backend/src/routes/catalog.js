const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');
const { appCache } = require('../utils/cache');

// 1. Car Catalog: Makes (Cached for 1 hour)
router.get('/catalog/makes', async (req, res) => {
  try {
    const cacheKey = 'catalog:makes';
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT DISTINCT make FROM car_catalog ORDER BY make ASC');
    const makes = rows.map(r => r.make);
    appCache.set(cacheKey, makes, 3600);
    res.json(makes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Car Catalog: Models by Make (Cached for 1 hour per make)
router.get('/catalog/models', async (req, res) => {
  try {
    const { make } = req.query;
    if (!make) {
      return res.status(400).json({ error: 'Le paramètre make est obligatoire' });
    }

    const cacheKey = `catalog:models:${make.toLowerCase().trim()}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, model, year_start, year_end FROM car_catalog WHERE make = ? ORDER BY model ASC',
      [make]
    );
    appCache.set(cacheKey, rows, 3600);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Car Catalog: Years by Make and Model (Cached for 1 hour)
router.get('/catalog/years', async (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) {
      return res.status(400).json({ error: 'Les paramètres make et model sont obligatoires' });
    }

    const cacheKey = `catalog:years:${make.toLowerCase()}:${model.toLowerCase()}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT year_start, year_end FROM car_catalog WHERE make = ? AND model = ? LIMIT 1',
      [make, model]
    );

    if (rows.length === 0 || !rows[0].year_start) {
      const currentYear = new Date().getFullYear();
      const defaultYears = Array.from({ length: 25 }, (_, i) => currentYear - i);
      return res.json(defaultYears);
    }

    const start = rows[0].year_start;
    const end = rows[0].year_end || new Date().getFullYear();
    const years = [];
    for (let y = end; y >= start; y--) {
      years.push(y);
    }

    appCache.set(cacheKey, years, 3600);
    res.json(years);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Car Catalog: Engines (Cached for 1 hour)
router.get('/catalog/engines', async (req, res) => {
  try {
    const { make, model, year } = req.query;
    if (!make) {
      return res.status(400).json({ error: 'Le paramètre make est obligatoire' });
    }

    const cacheKey = `catalog:engines:${make.toLowerCase().trim()}:${(model || '').toLowerCase().trim()}:${year || 'all'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    let query = `
      SELECT id, name, power_hp, power_kw, torque_nm, displacement, cylinders,
             fuel, gearbox, drive_type, top_speed, acceleration, dimensions, weight, tires
      FROM car_specs_engines
      WHERE brand_name LIKE ?
    `;
    const params = [`%${make}%`];

    if (model) {
      const cleanModel = model.replace(/[-_]/g, ' ').trim();
      const firstWord = cleanModel.split(' ')[0];
      query += ` AND (model_family LIKE ? OR name LIKE ? OR model_family LIKE ?)`;
      params.push(`%${cleanModel}%`, `%${firstWord}%`, `%${firstWord}%`);
    }

    query += ` ORDER BY name ASC LIMIT 60`;
    const [rows] = await pool.query(query, params);
    appCache.set(cacheKey, rows, 3600);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Car Catalog: Engine Details (Cached for 1 hour)
router.get('/catalog/engine-details/:id', async (req, res) => {
  try {
    const cacheKey = `catalog:engine-details:${req.params.id}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM car_specs_engines WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Moteur non trouvé' });
    appCache.set(cacheKey, rows[0], 3600);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Symptoms Reference (Cached for 1 hour)
router.get('/symptoms', async (req, res) => {
  try {
    const cacheKey = 'symptoms:all';
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM symptoms ORDER BY id ASC');
    appCache.set(cacheKey, rows, 3600);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Single Symptom by ID (Cached for 1 hour)
router.get('/symptoms/:id', async (req, res) => {
  try {
    const cacheKey = `symptoms:id:${req.params.id}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM symptoms WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Symptom not found' });
    appCache.set(cacheKey, rows[0], 3600);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
