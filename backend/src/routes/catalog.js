const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');
const { appCache } = require('../utils/cache');
const {
  nhtsaProvider,
  gor3aProvider,
  meterAppProvider,
  getAllProvidersInfo
} = require('../services/vehicleCatalogSources');

// 0. Catalog Providers Metadata
router.get('/catalog/providers', (req, res) => {
  res.json({
    active_sources: getAllProvidersInfo(),
    status: 'success'
  });
});

// 1. Car Catalog: Makes (Supports ?source=auto|internal|nhtsa|gor3a|meterapp)
router.get('/catalog/makes', async (req, res) => {
  try {
    const source = (req.query.source || 'auto').toLowerCase();

    if (source === 'nhtsa') {
      const makes = await nhtsaProvider.getAllMakes();
      return res.json(makes);
    }
    if (source === 'gor3a') {
      const makes = await gor3aProvider.getAllMakes();
      return res.json(makes);
    }
    if (source === 'meterapp') {
      const makes = meterAppProvider.getAllMakes();
      return res.json(makes);
    }

    // Default: Internal MySQL with cached result
    const cacheKey = 'catalog:makes';
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT DISTINCT make FROM car_catalog ORDER BY make ASC');
    let makes = rows.map(r => r.make);

    if (makes.length === 0) {
      // Fallback to offline MeterApp if MySQL is empty
      makes = meterAppProvider.getAllMakes();
    }

    appCache.set(cacheKey, makes, 3600);
    res.json(makes);
  } catch (err) {
    // If MySQL failed, fallback to MeterApp offline library
    try {
      const fallbackMakes = meterAppProvider.getAllMakes();
      if (fallbackMakes.length > 0) return res.json(fallbackMakes);
    } catch (_) {}
    res.status(500).json({ error: err.message });
  }
});

// 2. Car Catalog: Models by Make (Supports ?source=auto|internal|nhtsa|gor3a|meterapp)
router.get('/catalog/models', async (req, res) => {
  try {
    const { make, source = 'auto' } = req.query;
    if (!make) {
      return res.status(400).json({ error: 'Le paramètre make est obligatoire' });
    }

    const src = source.toLowerCase();

    if (src === 'nhtsa') {
      const models = await nhtsaProvider.getModelsForMake(make);
      return res.json(models);
    }
    if (src === 'gor3a') {
      const models = await gor3aProvider.getModelsForMake(make);
      return res.json(models);
    }
    if (src === 'meterapp') {
      const models = meterAppProvider.getModelsForMake(make);
      return res.json(models);
    }

    // Default: Internal MySQL
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

    let models = rows;
    if (models.length === 0) {
      // Automatic cascade: Try MeterApp offline first, then gor3a
      const meterModels = meterAppProvider.getModelsForMake(make);
      if (meterModels && meterModels.length > 0) {
        models = meterModels;
      }
    }

    appCache.set(cacheKey, models, 3600);
    res.json(models);
  } catch (err) {
    try {
      const fallback = meterAppProvider.getModelsForMake(req.query.make);
      if (fallback.length > 0) return res.json(fallback);
    } catch (_) {}
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// DEDICATED ROUTES FOR THE 3 FREE APIs
// -----------------------------------------------------------------------------

// Method 1: NHTSA vPIC API
router.get('/catalog/nhtsa/makes', async (req, res) => {
  try {
    const makes = await nhtsaProvider.getAllMakes();
    res.json(makes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/nhtsa/models', async (req, res) => {
  try {
    const { make } = req.query;
    if (!make) return res.status(400).json({ error: 'make requis' });
    const models = await nhtsaProvider.getModelsForMake(make);
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/nhtsa/vin/:vin', async (req, res) => {
  try {
    const decoded = await nhtsaProvider.decodeVin(req.params.vin);
    res.json(decoded);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post(['/catalog/decode-vin', '/catalog/nhtsa/decode-vin'], async (req, res) => {
  try {
    const { vin } = req.body;
    if (!vin) return res.status(400).json({ error: 'Numéro VIN requis' });
    const decoded = await nhtsaProvider.decodeVin(vin);
    res.json(decoded);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Method 2: gor3a/vehicle-makes-models (Open Dataset ODbL)
router.get('/catalog/gor3a/makes', async (req, res) => {
  try {
    const makes = await gor3aProvider.getAllMakes();
    res.json(makes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/gor3a/models', async (req, res) => {
  try {
    const { make } = req.query;
    if (!make) return res.status(400).json({ error: 'make requis' });
    const models = await gor3aProvider.getModelsForMake(make);
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/gor3a/engines', async (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) return res.status(400).json({ error: 'make et model requis' });
    const engines = await gor3aProvider.getEnginesForModel(make, model);
    res.json(engines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Method 3: MeterApp vehicle-db (@meterapp Offline Library)
router.get('/catalog/meterapp/makes', (req, res) => {
  try {
    const makes = meterAppProvider.getAllMakes();
    res.json(makes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/meterapp/models', (req, res) => {
  try {
    const { make } = req.query;
    if (!make) return res.status(400).json({ error: 'make requis' });
    const models = meterAppProvider.getModelsForMake(make);
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/catalog/meterapp/years', (req, res) => {
  try {
    const { make, model } = req.query;
    if (!make || !model) return res.status(400).json({ error: 'make et model requis' });
    const years = meterAppProvider.getAvailableYears(make, model);
    res.json(years);
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
    let [rows] = await pool.query(query, params);

    // Fallback to local gor3a dataset if MySQL has no engines for this model
    if (rows.length === 0 && model) {
      try {
        const gor3aEngines = await gor3aProvider.getEnginesForModel(make, model);
        if (gor3aEngines && gor3aEngines.length > 0) {
          rows = gor3aEngines;
        }
      } catch (_) {}
    }

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
