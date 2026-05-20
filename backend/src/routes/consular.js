const router = require('express').Router();
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const audit = require('../middleware/audit');
const validate = require('../middleware/validate');
const { upload, saveImageToDB } = require('../config/upload');

// Busca atendimentos anteriores para reutilizar dados no formulário
router.get('/search', authenticate, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (visitor_name)
         ca.id, visitor_name, visit_reason, employee_id,
         e.name as employee_name, date
       FROM consular_appointments ca
       LEFT JOIN employees e ON ca.employee_id = e.id
       WHERE ca.visitor_name ILIKE $1
       ORDER BY visitor_name, date DESC
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT ca.*, e.name as employee_name, di.id as image_id
       FROM consular_appointments ca
       LEFT JOIN employees e ON ca.employee_id=e.id
       LEFT JOIN document_images di ON di.entity_type='consular' AND di.entity_id=ca.id
       WHERE ca.date=$1 ORDER BY ca.scheduled_time, ca.entry_time`, [date]
    );
    const inside = await pool.query(
      `SELECT ca.*, e.name as employee_name FROM consular_appointments ca
       LEFT JOIN employees e ON ca.employee_id=e.id
       WHERE ca.exit_time IS NULL AND ca.entry_time IS NOT NULL ORDER BY ca.entry_time DESC`
    );
    res.json({ appointments: result.rows, currently_inside: inside.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/',
  authenticate, upload.single('document_photo'), audit('CREATE','consular_appointment'),
  body('visitor_name').trim().isLength({ min: 2, max: 150 }).withMessage('Nome do visitante inválido'),
  body('visit_reason').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Motivo muito longo'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Notas muito longas'),
  validate,
  async (req, res) => {
    const { visitor_name, visit_reason, employee_id, scheduled_time, notes } = req.body;
    try {
      const result = await pool.query(
        `INSERT INTO consular_appointments (visitor_name,visit_reason,employee_id,scheduled_time,entry_time,date,notes,created_by)
         VALUES ($1,$2,$3,$4,NOW(),(NOW() AT TIME ZONE 'America/Sao_Paulo')::date,$5,$6) RETURNING *`,
        [visitor_name, visit_reason, employee_id||null, scheduled_time||null, notes, req.user.id]
      );
      const appt = result.rows[0];
      if (req.file) await saveImageToDB(req.file, 'consular', appt.id);
      res.status(201).json(appt);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

router.put('/:id',
  authenticate, audit('UPDATE','consular_appointment'),
  body('notes').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Notas muito longas'),
  validate,
  async (req, res) => {
    const { exit_time, notes } = req.body;
    try {
      const result = await pool.query(
        `UPDATE consular_appointments SET exit_time=COALESCE($1,NOW()), notes=COALESCE($2,notes), updated_at=NOW() WHERE id=$3 RETURNING *`,
        [exit_time||null, notes||null, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
);

module.exports = router;
