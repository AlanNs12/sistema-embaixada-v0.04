const router = require('express').Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const audit = require('../middleware/audit');
const upload = require('../config/upload');

// GET /api/consular?date=...
router.get('/', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT ca.*, e.name as employee_name
       FROM consular_appointments ca
       LEFT JOIN employees e ON ca.employee_id = e.id
       WHERE ca.date = $1 ORDER BY ca.scheduled_time, ca.entry_time`,
      [date]
    );
    const inside = await pool.query(
      `SELECT ca.*, e.name as employee_name
       FROM consular_appointments ca
       LEFT JOIN employees e ON ca.employee_id = e.id
       WHERE ca.exit_time IS NULL AND ca.entry_time IS NOT NULL
       ORDER BY ca.entry_time DESC`
    );
    res.json({ appointments: result.rows, currently_inside: inside.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/consular
router.post('/', authenticate, upload.single('document_photo'), audit('CREATE', 'consular_appointment'), async (req, res) => {
  const { visitor_name, visit_reason, employee_id, scheduled_time, notes } = req.body;
  if (!visitor_name) return res.status(400).json({ error: 'Nome do visitante é obrigatório' });
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
  const date = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `INSERT INTO consular_appointments
         (visitor_name, document_photo, visit_reason, employee_id, scheduled_time,
          entry_time, date, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,$8) RETURNING *`,
      [visitor_name, photoPath, visit_reason, employee_id || null,
       scheduled_time || null, date, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/consular/:id - register exit
router.put('/:id', authenticate, audit('UPDATE', 'consular_appointment'), async (req, res) => {
  const { exit_time, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE consular_appointments SET
         exit_time = COALESCE($1, NOW()),
         notes = COALESCE($2, notes),
         updated_at = NOW()
       WHERE id=$3 RETURNING *`,
      [exit_time || null, notes || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
