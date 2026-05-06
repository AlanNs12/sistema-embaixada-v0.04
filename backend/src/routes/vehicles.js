const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const validate = require('../middleware/validate');

// GET /api/vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE active=true ORDER BY model');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/vehicles (admin+)
router.post('/',
  authenticate, authorize('super_admin','admin'), audit('CREATE','vehicle'),
  body('plate').trim().isLength({ min: 1, max: 20 }).withMessage('Placa inválida'),
  body('model').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Modelo muito longo'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Descrição muito longa'),
  validate,
  async (req, res) => {
    const { plate, model, description } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO vehicles (plate,model,description) VALUES ($1,$2,$3) RETURNING *',
        [plate.toUpperCase(), model, description]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Placa já cadastrada' });
      res.status(500).json({ error: err.message });
    }
  }
);

// PUT /api/vehicles/:id (admin+)
router.put('/:id',
  authenticate, authorize('super_admin','admin'), audit('UPDATE','vehicle'),
  body('plate').trim().isLength({ min: 1, max: 20 }).withMessage('Placa inválida'),
  body('model').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Modelo muito longo'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Descrição muito longa'),
  validate,
  async (req, res) => {
    const { plate, model, description, active } = req.body;
    try {
      await pool.query('UPDATE vehicles SET plate=$1,model=$2,description=$3,active=$4 WHERE id=$5',
        [plate.toUpperCase(), model, description, active, req.params.id]);
      res.json({ message: 'Veículo atualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// GET /api/vehicles/logs
router.get('/logs', authenticate, async (req, res) => {
  const { date, vehicle_id } = req.query;
  const d = date || new Date().toISOString().split('T')[0];
  try {
    let q = `SELECT vl.*, v.plate, v.model FROM vehicle_logs vl JOIN vehicles v ON vl.vehicle_id=v.id WHERE vl.date=$1`;
    const params = [d];
    if (vehicle_id) { params.push(vehicle_id); q += ` AND vl.vehicle_id=$${params.length}`; }
    q += ' ORDER BY vl.departure_time DESC';
    const result = await pool.query(q, params);
    const out = await pool.query(
      `SELECT vl.*, v.plate, v.model FROM vehicle_logs vl JOIN vehicles v ON vl.vehicle_id=v.id
       WHERE vl.return_time IS NULL ORDER BY vl.departure_time DESC`);
    res.json({ logs: result.rows, vehicles_out: out.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/vehicles/logs (porteiro+)
router.post('/logs',
  authenticate, authorize('super_admin','admin','porteiro'), audit('CREATE','vehicle_log'),
  body('driver').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Nome do motorista muito longo'),
  body('passengers').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Passageiros muito longo'),
  body('reason').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Motivo muito longo'),
  body('observations').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Observações muito longas'),
  validate,
  async (req, res) => {
    const { vehicle_id, date, departure_time, driver, passengers, reason, observations } = req.body;
    if (!vehicle_id || !departure_time) return res.status(400).json({ error: 'Veículo e horário de saída são obrigatórios' });
    const d = date || new Date().toISOString().split('T')[0];
    try {
      const result = await pool.query(
        `INSERT INTO vehicle_logs (vehicle_id,date,departure_time,driver,passengers,reason,observations,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [vehicle_id, d, departure_time, driver, passengers, reason, observations, req.user.id]);
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// PUT /api/vehicles/logs/:id — porteiro pode editar observations e registrar retorno
router.put('/logs/:id', authenticate, authorize('super_admin','admin','porteiro'), audit('UPDATE','vehicle_log'), async (req, res) => {
  const { return_time, return_date, driver, passengers, reason, observations } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicle_logs SET
         return_time  = COALESCE($1, return_time),
         return_date  = COALESCE($2, return_date),
         driver       = COALESCE($3, driver),
         passengers   = COALESCE($4, passengers),
         reason       = COALESCE($5, reason),
         observations = COALESCE($6, observations),
         updated_at   = NOW()
       WHERE id=$7 RETURNING *`,
      [return_time||null, return_date||null, driver||null, passengers||null, reason||null, observations||null, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
