const router = require('express').Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const audit = require('../middleware/audit');

// GET /api/packages?status=pending
router.get('/', authenticate, async (req, res) => {
  const { status, date } = req.query;
  try {
    let query = `SELECT p.*, e.name as recipient_employee_name, e2.name as delivered_to_employee_name
                 FROM packages p
                 LEFT JOIN employees e ON p.recipient_employee_id = e.id
                 LEFT JOIN employees e2 ON p.delivered_to_id = e2.id
                 WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND p.status = $${params.length}`; }
    if (date) { params.push(date); query += ` AND DATE(p.received_at) = $${params.length}`; }
    query += ' ORDER BY p.received_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/packages - register received package
router.post('/', authenticate, audit('CREATE', 'package'), async (req, res) => {
  const { delivery_company, tracking_code, recipient_employee_id, recipient_name, notes } = req.body;
  if (!delivery_company) return res.status(400).json({ error: 'Empresa entregadora é obrigatória' });
  try {
    const result = await pool.query(
      `INSERT INTO packages
         (delivery_company, tracking_code, recipient_employee_id, recipient_name, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [delivery_company, tracking_code, recipient_employee_id || null,
       recipient_name, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/packages/:id - mark as delivered
router.put('/:id', authenticate, audit('UPDATE', 'package'), async (req, res) => {
  const { delivered_to_id, delivered_to_name, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE packages SET
         delivered_to_id = $1,
         delivered_to_name = $2,
         delivered_at = NOW(),
         status = 'delivered',
         notes = COALESCE($3, notes),
         updated_at = NOW()
       WHERE id=$4 RETURNING *`,
      [delivered_to_id || null, delivered_to_name, notes || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
