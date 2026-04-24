const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { upload, saveImageToDB } = require('../config/upload');

router.get('/', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT vl.*, e.name as employee_name, di.id as image_id
       FROM visitor_logs vl
       LEFT JOIN employees e ON vl.employee_id=e.id
       LEFT JOIN document_images di ON di.entity_type='visitor' AND di.entity_id=vl.id
       WHERE vl.date=$1 ORDER BY vl.entry_time DESC`, [date]
    );
    const inside = await pool.query(
      `SELECT vl.*, e.name as employee_name FROM visitor_logs vl
       LEFT JOIN employees e ON vl.employee_id=e.id
       WHERE vl.exit_time IS NULL AND vl.entry_time IS NOT NULL ORDER BY vl.entry_time DESC`
    );
    res.json({ visitors: result.rows, currently_inside: inside.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, authorize('super_admin','admin','porteiro'), upload.single('document_photo'), audit('CREATE','visitor'), async (req, res) => {
  const { visitor_name, document_number, reason, employee_id, notes } = req.body;
  if (!visitor_name) return res.status(400).json({ error: 'Nome do visitante obrigatório' });
  const date = new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `INSERT INTO visitor_logs (visitor_name,document_number,reason,employee_id,entry_time,date,notes,created_by)
       VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7) RETURNING *`,
      [visitor_name, document_number||null, reason, employee_id||null, date, notes, req.user.id]
    );
    const vis = result.rows[0];
    if (req.file) await saveImageToDB(req.file, 'visitor', vis.id);
    res.status(201).json(vis);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, authorize('super_admin','admin','porteiro'), audit('UPDATE','visitor'), async (req, res) => {
  const { exit_time, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE visitor_logs SET exit_time=COALESCE($1::timestamp,NOW()), notes=COALESCE($2,notes), updated_at=NOW() WHERE id=$3 RETURNING *`,
      [exit_time||null, notes||null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
