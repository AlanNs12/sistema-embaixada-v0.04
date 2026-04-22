const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// GET /api/vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE active=true ORDER BY model'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehicles
router.post('/', authenticate, authorize('super_admin', 'admin'), audit('CREATE', 'vehicle'), async (req, res) => {
  const { plate, model, description } = req.body;
  if (!plate) return res.status(400).json({ error: 'Placa é obrigatória' });
  try {
    const result = await pool.query(
      'INSERT INTO vehicles (plate, model, description) VALUES ($1,$2,$3) RETURNING *',
      [plate.toUpperCase(), model, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Placa já cadastrada' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', authenticate, authorize('super_admin', 'admin'), audit('UPDATE', 'vehicle'), async (req, res) => {
  const { plate, model, description, active } = req.body;
  try {
    await pool.query(
      'UPDATE vehicles SET plate=$1, model=$2, description=$3, active=$4 WHERE id=$5',
      [plate.toUpperCase(), model, description, active, req.params.id]
    );
    res.json({ message: 'Veículo atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vehicles/logs?date=...&vehicle_id=...
router.get('/logs', authenticate, async (req, res) => {
  const { date, vehicle_id } = req.query;
  const d = date || new Date().toISOString().split('T')[0];
  try {
    let query = `SELECT vl.*, v.plate, v.model FROM vehicle_logs vl
                 JOIN vehicles v ON vl.vehicle_id = v.id
                 WHERE vl.date = $1`;
    const params = [d];
    if (vehicle_id) {
      params.push(vehicle_id);
      query += ` AND vl.vehicle_id = $${params.length}`;
    }
    query += ' ORDER BY vl.departure_time DESC';
    const result = await pool.query(query, params);

    // Dashboard: vehicles currently out (departed, not returned)
    const out = await pool.query(
      `SELECT vl.*, v.plate, v.model FROM vehicle_logs vl
       JOIN vehicles v ON vl.vehicle_id = v.id
       WHERE vl.return_time IS NULL ORDER BY vl.departure_time DESC`
    );
    res.json({ logs: result.rows, vehicles_out: out.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vehicles/logs
router.post('/logs', authenticate, audit('CREATE', 'vehicle_log'), async (req, res) => {
  const { vehicle_id, date, departure_time, driver, passengers, reason, observations } = req.body;
  if (!vehicle_id || !departure_time)
    return res.status(400).json({ error: 'Veículo e horário de saída são obrigatórios' });
  const d = date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `INSERT INTO vehicle_logs
         (vehicle_id, date, departure_time, driver, passengers, reason, observations, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [vehicle_id, d, departure_time, driver, passengers, reason, observations, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vehicles/logs/:id - register return or update
router.put('/logs/:id', authenticate, audit('UPDATE', 'vehicle_log'), async (req, res) => {
  const { return_time, driver, passengers, reason, observations } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicle_logs SET
         return_time = COALESCE($1, return_time),
         driver = COALESCE($2, driver),
         passengers = COALESCE($3, passengers),
         reason = COALESCE($4, reason),
         observations = COALESCE($5, observations),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [return_time || null, driver || null, passengers || null,
       reason || null, observations || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
