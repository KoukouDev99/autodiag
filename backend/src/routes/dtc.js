const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');
const { appCache } = require('../utils/cache');

// 1. DTC Lookup & Search (Wal33D/dtc-database Engine - Cached for 30 min)
router.get('/dtc/search', async (req, res) => {
  try {
    const { q, type, make, limit = 50, offset = 0 } = req.query;
    const cacheKey = `dtc:search:${(q || '').trim().toUpperCase()}:${(type || '').toUpperCase()}:${(make || '').toUpperCase()}:${limit}:${offset}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
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

    appCache.set(cacheKey, results, 1800);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. DTC Global Statistics (Cached for 1 hour)
router.get('/dtc/stats', async (req, res) => {
  try {
    const cacheKey = 'dtc:stats';
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM dtc_codes');
    const [typeRows] = await pool.query('SELECT type, COUNT(*) as count FROM dtc_codes GROUP BY type ORDER BY count DESC');
    const [genericRows] = await pool.query('SELECT is_generic, COUNT(*) as count FROM dtc_codes GROUP BY is_generic');
    
    const stats = {
      total_unique_codes: totalRows[0].total,
      breakdown_by_type: typeRows,
      generic_vs_manufacturer: genericRows,
      supported_manufacturers_count: 33,
      standards: 'SAE J2012 / ISO 15031-6'
    };

    appCache.set(cacheKey, stats, 3600);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. DTC Code Details (Cached for 1 hour per code+make)
router.get('/dtc/:code', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const make = req.query.make ? req.query.make.trim().toUpperCase() : null;

    const cacheKey = `dtc:detail:${code}:${make || 'ALL'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
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

    const result = {
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
    };

    appCache.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. OBD-II Live Data PIDs (Mode 01 & Mode 09) (Cached for 1 hour)
router.get('/pids', async (req, res) => {
  try {
    const { mode } = req.query;
    const cacheKey = `obd:pids:${mode || 'ALL'}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    let sql = 'SELECT * FROM obd_pids';
    const params = [];
    if (mode) {
      sql += ' WHERE mode = ?';
      params.push(mode);
    }
    sql += ' ORDER BY mode ASC, pid ASC';
    const [rows] = await pool.query(sql, params);
    appCache.set(cacheKey, rows, 3600);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pids/:mode/:pid', async (req, res) => {
  try {
    const { mode, pid } = req.params;
    const cacheKey = `obd:pid:${mode}:${pid.toUpperCase()}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM obd_pids WHERE mode = ? AND pid = ?', [mode, pid.toUpperCase()]);
    if (rows.length === 0) return res.status(404).json({ error: `PID ${pid} (Mode ${mode}) non trouvé` });
    appCache.set(cacheKey, rows[0], 3600);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Knowledge Base (Structured Automotive Diagnostics)
router.get('/kb/categories', async (req, res) => {
  try {
    const cacheKey = 'kb:categories';
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT category_id, category, icon, COUNT(*) as count 
      FROM diagnostic_kb 
      GROUP BY category_id, category, icon 
      ORDER BY category ASC
    `);
    appCache.set(cacheKey, rows, 3600);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kb/diagnostics', async (req, res) => {
  try {
    const { category, query } = req.query;
    const cacheKey = `kb:diagnostics:${(category || 'ALL').toLowerCase()}:${(query || '').trim().toLowerCase()}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
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

    appCache.set(cacheKey, parsed, 3600);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kb/diagnostics/:id', async (req, res) => {
  try {
    const cacheKey = `kb:diagnostic:${req.params.id}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM diagnostic_kb WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Diagnostic item not found' });
    
    const item = rows[0];
    const parsed = {
      ...item,
      symptoms: typeof item.symptoms === 'string' ? JSON.parse(item.symptoms) : item.symptoms,
      diagnosis_steps: typeof item.diagnosis_steps === 'string' ? JSON.parse(item.diagnosis_steps) : item.diagnosis_steps,
      repair_guide: typeof item.repair_guide === 'string' ? JSON.parse(item.repair_guide) : item.repair_guide
    };
    appCache.set(cacheKey, parsed, 3600);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
