const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const validate = require('../middleware/validate');

// GET /api/outsourced
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM outsourced_workers WHERE active=true ORDER BY name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/outsourced
router.post('/',
  authenticate, authorize('super_admin', 'admin'), audit('CREATE', 'outsourced_worker'),
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Nome deve ter entre 2 e 150 caracteres'),
  body('role').trim().isLength({ min: 1, max: 100 }).withMessage('Função é obrigatória e deve ter no máximo 100 caracteres'),
  body('company').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Empresa muito longa'),
  validate,
  async (req, res) => {
    const { name, role, company } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO outsourced_workers (name, role, company) VALUES ($1,$2,$3) RETURNING *',
        [name, role, company]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// PUT /api/outsourced/:id
router.put('/:id',
  authenticate, authorize('super_admin', 'admin'), audit('UPDATE', 'outsourced_worker'),
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Nome deve ter entre 2 e 150 caracteres'),
  body('role').trim().isLength({ min: 1, max: 100 }).withMessage('Função inválida'),
  body('company').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Empresa muito longa'),
  validate,
  async (req, res) => {
    const { name, role, company, active } = req.body;
    try {
      await pool.query('UPDATE outsourced_workers SET name=$1, role=$2, company=$3, active=$4 WHERE id=$5',
        [name, role, company, active, req.params.id]);
      res.json({ message: 'Terceirizado atualizado' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

// GET /api/outsourced/attendance?date=...
router.get('/attendance', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT oa.*, ow.name as worker_name, ow.role as worker_role, ow.company
       FROM outsourced_attendance oa
       JOIN outsourced_workers ow ON oa.worker_id = ow.id
       WHERE oa.date = $1 ORDER BY ow.name`, [date]);
    const allWorkers = await pool.query('SELECT * FROM outsourced_workers WHERE active=true ORDER BY name');
    const presentIds = new Set(result.rows.map(r => r.worker_id));
    const absent = allWorkers.rows.filter(w => !presentIds.has(w.id)).map(w => ({
      worker_id: w.id, worker_name: w.name, worker_role: w.role,
      company: w.company, date, entry_time: null, exit_time: null,
    }));
    res.json({ present: result.rows, absent });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/outsourced/attendance — create or upsert
router.post('/attendance', authenticate, authorize('super_admin', 'admin', 'porteiro'), audit('UPSERT', 'outsourced_attendance'), async (req, res) => {
  const { worker_id, date, entry_time, exit_time, notes } = req.body;
  if (!worker_id) return res.status(400).json({ error: 'Terceirizado obrigatório' });
  const d = date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `INSERT INTO outsourced_attendance (worker_id, date, entry_time, exit_time, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (worker_id, date) DO UPDATE SET
         entry_time = COALESCE(EXCLUDED.entry_time, outsourced_attendance.entry_time),
         exit_time  = COALESCE(EXCLUDED.exit_time,  outsourced_attendance.exit_time),
         notes      = COALESCE(EXCLUDED.notes,      outsourced_attendance.notes),
         updated_at = NOW()
       RETURNING *`,
      [worker_id, d, entry_time || null, exit_time || null, notes || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/outsourced/attendance/:id
router.put('/attendance/:id', authenticate, authorize('super_admin', 'admin', 'porteiro'), audit('UPDATE', 'outsourced_attendance'), async (req, res) => {
  const { entry_time, exit_time, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE outsourced_attendance SET
         entry_time = CASE WHEN $1::text IS NOT NULL THEN $1::time ELSE entry_time END,
         exit_time  = CASE WHEN $2::text IS NOT NULL THEN $2::time ELSE exit_time  END,
         notes      = CASE WHEN $3::text IS NOT NULL THEN $3       ELSE notes      END,
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [entry_time || null, exit_time || null, notes || null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Registro não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('outsourced attendance PUT error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
