const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// GET /api/employees
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM employees WHERE active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees
router.post('/', authenticate, authorize('super_admin', 'admin'), audit('CREATE', 'employee'), async (req, res) => {
  const { name, position, department, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    const result = await pool.query(
      `INSERT INTO employees (name, position, department, email, phone)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, position, department, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/:id
router.put('/:id', authenticate, authorize('super_admin', 'admin'), audit('UPDATE', 'employee'), async (req, res) => {
  const { name, position, department, email, phone, active } = req.body;
  try {
    await pool.query(
      `UPDATE employees SET name=$1, position=$2, department=$3, email=$4, phone=$5,
       active=$6, updated_at=NOW() WHERE id=$7`,
      [name, position, department, email, phone, active, req.params.id]
    );
    res.json({ message: 'Funcionário atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ATTENDANCE ---

// GET /api/employees/attendance?date=2024-01-15
router.get('/attendance', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT ea.*, e.name as employee_name, e.position, e.department
       FROM employee_attendance ea
       JOIN employees e ON ea.employee_id = e.id
       WHERE ea.date = $1 ORDER BY e.name`,
      [date]
    );
    // Also get employees without record today
    const allEmps = await pool.query('SELECT * FROM employees WHERE active=true ORDER BY name');
    const presentIds = new Set(result.rows.map((r) => r.employee_id));
    const absent = allEmps.rows.filter((e) => !presentIds.has(e.id)).map((e) => ({
      employee_id: e.id,
      employee_name: e.name,
      position: e.position,
      department: e.department,
      date,
      entry_time: null,
      lunch_out_time: null,
      lunch_return_time: null,
      exit_time: null,
    }));
    res.json({ present: result.rows, absent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees/attendance - create or update (upsert)
router.post('/attendance', authenticate, audit('UPSERT', 'employee_attendance'), async (req, res) => {
  const { employee_id, date, entry_time, lunch_out_time, lunch_return_time, exit_time, notes } = req.body;
  if (!employee_id) return res.status(400).json({ error: 'Funcionário obrigatório' });
  const d = date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `INSERT INTO employee_attendance
         (employee_id, date, entry_time, lunch_out_time, lunch_return_time, exit_time, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (employee_id, date) DO UPDATE SET
         entry_time = COALESCE(EXCLUDED.entry_time, employee_attendance.entry_time),
         lunch_out_time = COALESCE(EXCLUDED.lunch_out_time, employee_attendance.lunch_out_time),
         lunch_return_time = COALESCE(EXCLUDED.lunch_return_time, employee_attendance.lunch_return_time),
         exit_time = COALESCE(EXCLUDED.exit_time, employee_attendance.exit_time),
         notes = COALESCE(EXCLUDED.notes, employee_attendance.notes),
         updated_at = NOW()
       RETURNING *`,
      [employee_id, d, entry_time || null, lunch_out_time || null, lunch_return_time || null,
       exit_time || null, notes || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/attendance/:id - update specific field
router.put('/attendance/:id', authenticate, audit('UPDATE', 'employee_attendance'), async (req, res) => {
  const { entry_time, lunch_out_time, lunch_return_time, exit_time, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE employee_attendance SET
         entry_time = COALESCE($1, entry_time),
         lunch_out_time = COALESCE($2, lunch_out_time),
         lunch_return_time = COALESCE($3, lunch_return_time),
         exit_time = COALESCE($4, exit_time),
         notes = COALESCE($5, notes),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [entry_time || null, lunch_out_time || null, lunch_return_time || null,
       exit_time || null, notes || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
