const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const upload = require('../config/upload');

// GET /api/providers - list registered providers
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM service_providers WHERE active=true ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers - register provider with optional photo
router.post('/', authenticate, authorize('super_admin', 'admin'), upload.single('document_photo'), audit('CREATE', 'service_provider'), async (req, res) => {
  const { name, company, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await pool.query(
      'INSERT INTO service_providers (name, company, document_photo, notes) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, company, photoPath, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/providers/:id
router.put('/:id', authenticate, authorize('super_admin', 'admin'), upload.single('document_photo'), audit('UPDATE', 'service_provider'), async (req, res) => {
  const { name, company, notes, active } = req.body;
  const photoPath = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    const fields = ['name=$1', 'company=$2', 'notes=$3', 'active=$4', 'updated_at=NOW()'];
    const params = [name, company, notes, active !== undefined ? active : true];
    if (photoPath) {
      fields.push(`document_photo=$${params.length + 1}`);
      params.push(photoPath);
    }
    params.push(req.params.id);
    await pool.query(
      `UPDATE service_providers SET ${fields.join(',')} WHERE id=$${params.length}`,
      params
    );
    res.json({ message: 'Prestador atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/providers/visits?date=...
router.get('/visits', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT spv.*, sp.name as registered_name, sp.company as registered_company,
              e.name as employee_name
       FROM service_provider_visits spv
       LEFT JOIN service_providers sp ON spv.provider_id = sp.id
       LEFT JOIN employees e ON spv.employee_id = e.id
       WHERE DATE(spv.entry_time) = $1
       ORDER BY spv.entry_time DESC`,
      [date]
    );
    // Currently inside
    const inside = await pool.query(
      `SELECT spv.*, sp.name as registered_name, e.name as employee_name
       FROM service_provider_visits spv
       LEFT JOIN service_providers sp ON spv.provider_id = sp.id
       LEFT JOIN employees e ON spv.employee_id = e.id
       WHERE spv.exit_time IS NULL ORDER BY spv.entry_time DESC`
    );
    res.json({ visits: result.rows, currently_inside: inside.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/providers/visits - register visit (registered or walk-in)
router.post('/visits', authenticate, upload.single('document_photo'), audit('CREATE', 'provider_visit'), async (req, res) => {
  const { provider_id, visitor_name, company, reason, employee_id, notes } = req.body;
  const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

  // If registered provider, pull their name/company
  let name = visitor_name;
  let comp = company;
  if (provider_id) {
    const p = await pool.query('SELECT * FROM service_providers WHERE id=$1', [provider_id]);
    if (p.rows[0]) { name = name || p.rows[0].name; comp = comp || p.rows[0].company; }
  }

  try {
    const result = await pool.query(
      `INSERT INTO service_provider_visits
         (provider_id, visitor_name, company, document_photo, reason, employee_id, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [provider_id || null, name, comp, photoPath, reason, employee_id || null, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/providers/visits/:id - register exit
router.put('/visits/:id', authenticate, audit('UPDATE', 'provider_visit'), async (req, res) => {
  const { exit_time, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE service_provider_visits SET
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
