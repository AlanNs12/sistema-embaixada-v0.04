const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// GET /api/outsourced
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM outsourced_workers WHERE active=true ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outsourced
router.post('/', authenticate, authorize('super_admin', 'admin'), audit('CREATE', 'outsourced_worker'), async (req, res) => {
  const { name, role, company } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Nome e função são obrigatórios' });
  try {
    const result = await pool.query(
      'INSERT INTO outsourced_workers (name, role, company) VALUES ($1,$2,$3) RETURNING *',
      [name, role, company]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/outsourced/:id
router.put('/:id', authenticate, authorize('super_admin', 'admin'), audit('UPDATE', 'outsourced_worker'), async (req, res) => {
  const { name, role, company, active } = req.body;
  try {
    await pool.query(
      'UPDATE outsourced_workers SET name=$1, role=$2, company=$3, active=$4 WHERE id=$5',
      [name, role, company, active, req.params.id]
    );
    res.json({ message: 'Terceirizado atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/outsourced/attendance?date=...
router.get('/attendance', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT oa.*, ow.name as worker_name, ow.role as worker_role, ow.company
       FROM outsourced_attendance oa
       JOIN outsourced_workers ow ON oa.worker_id = ow.id
       WHERE oa.date = $1 ORDER BY ow.name`,
      [date]
    );
    const allWorkers = await pool.query(
      'SELECT * FROM outsourced_workers WHERE active=true ORDER BY name'
    );
    const presentIds = new Set(result.rows.map((r) => r.worker_id));
    const absent = allWorkers.rows
      .filter((w) => !presentIds.has(w.id))
      .map((w) => ({
        worker_id: w.id, worker_name: w.name,
        worker_role: w.role, company: w.company,
        date, entry_time: null, exit_time: null,
      }));
    res.json({ present: result.rows, absent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outsourced/attendance
router.post('/attendance', authenticate, audit('UPSERT', 'outsourced_attendance'), async (req, res) => {
  const { worker_id, date, entry_time, exit_time, notes } = req.body;
  if (!worker_id) return res.status(400).json({ error: 'Terceirizado obrigatório' });
  const d = date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `INSERT INTO outsourced_attendance (worker_id, date, entry_time, exit_time, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (worker_id, date) DO UPDATE SET
         entry_time = COALESCE(EXCLUDED.entry_time, outsourced_attendance.entry_time),
         exit_time = COALESCE(EXCLUDED.exit_time, outsourced_attendance.exit_time),
         notes = COALESCE(EXCLUDED.notes, outsourced_attendance.notes),
         updated_at = NOW()
       RETURNING *`,
      [worker_id, d, entry_time || null, exit_time || null, notes || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
