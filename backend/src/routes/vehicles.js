const express = require('express');
const router = express.Router();
const { getPool } = require('../db/db');

// 1. Get all vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM vehicles ORDER BY is_primary DESC, id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get single vehicle by ID
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

// 3. Update vehicle
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

// 4. Create new vehicle
router.post('/vehicles', async (req, res) => {
  try {
    const pool = getPool();
    const { user_id = 1, brand, model, year, fuel, engine, mileage, mileage_unit = 'km', license_plate, plate_country = 'F', is_primary = false } = req.body;
    
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

// 5. Set vehicle as primary
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

// 6. Delete vehicle
router.delete('/vehicles/:id', async (req, res) => {
  try {
    const pool = getPool();
    const id = req.params.id;
    const [found] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (found.length === 0) return res.status(404).json({ error: 'Véhicule non trouvé' });

    const vehicle = found[0];
    await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);

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

// 7. Maintenance records for a vehicle
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

router.post('/maintenance/:vehicleId', async (req, res) => {
  try {
    const pool = getPool();
    const { service_date, service_type, cost, mileage, notes } = req.body;
    const [result] = await pool.query(
      `INSERT INTO maintenance_records (vehicle_id, service_date, service_type, cost, mileage, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.vehicleId, service_date, service_type, cost || 0, mileage || 0, notes || '']
    );
    const [created] = await pool.query('SELECT * FROM maintenance_records WHERE id = ?', [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
