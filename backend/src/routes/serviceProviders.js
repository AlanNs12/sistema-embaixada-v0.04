const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { upload, saveImageToDB, updateImageEntity } = require('../config/upload');

// GET /api/providers
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.*, di.id as image_id FROM service_providers sp
       LEFT JOIN document_images di ON di.entity_type='provider' AND di.entity_id=sp.id
       WHERE sp.active=true ORDER BY sp.name`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/providers
router.post('/', authenticate, authorize('super_admin','admin'), upload.single('document_photo'), audit('CREATE','service_provider'), async (req, res) => {
  const { name, company, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });
  try {
    const result = await pool.query(
      'INSERT INTO service_providers (name,company,notes) VALUES ($1,$2,$3) RETURNING *',
      [name, company, notes]
    );
    const provider = result.rows[0];
    if (req.file) await saveImageToDB(req.file, 'provider', provider.id);
    res.status(201).json(provider);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/providers/:id
router.put('/:id', authenticate, authorize('super_admin','admin'), upload.single('document_photo'), audit('UPDATE','service_provider'), async (req, res) => {
  const { name, company, notes, active } = req.body;
  try {
    await pool.query(
      'UPDATE service_providers SET name=$1,company=$2,notes=$3,active=$4,updated_at=NOW() WHERE id=$5',
      [name, company, notes, active!==false, req.params.id]
    );
    if (req.file) {
      await pool.query("DELETE FROM document_images WHERE entity_type='provider' AND entity_id=$1", [req.params.id]);
      await saveImageToDB(req.file, 'provider', req.params.id);
    }
    res.json({ message: 'Prestador atualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/providers/visits
router.get('/visits', authenticate, async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  try {
    const result = await pool.query(
      `SELECT spv.*, sp.name as registered_name, sp.company as registered_company,
              e.name as employee_name,
              di.id as image_id
       FROM service_provider_visits spv
       LEFT JOIN service_providers sp ON spv.provider_id=sp.id
       LEFT JOIN employees e ON spv.employee_id=e.id
       LEFT JOIN document_images di ON di.entity_type='provider_visit' AND di.entity_id=spv.id
       WHERE DATE(spv.entry_time)=$1 ORDER BY spv.entry_time DESC`, [date]
    );
    const inside = await pool.query(
      `SELECT spv.*, COALESCE(sp.name,spv.visitor_name) as name, e.name as employee_name
       FROM service_provider_visits spv
       LEFT JOIN service_providers sp ON spv.provider_id=sp.id
       LEFT JOIN employees e ON spv.employee_id=e.id
       WHERE spv.exit_time IS NULL ORDER BY spv.entry_time DESC`
    );
    res.json({ visits: result.rows, currently_inside: inside.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/providers/visits
router.post('/visits', authenticate, upload.single('document_photo'), audit('CREATE','provider_visit'), async (req, res) => {
  const { provider_id, visitor_name, company, reason, employee_id, notes } = req.body;
  let name = visitor_name, comp = company;
  if (provider_id) {
    const p = await pool.query('SELECT * FROM service_providers WHERE id=$1', [provider_id]);
    if (p.rows[0]) { name = name || p.rows[0].name; comp = comp || p.rows[0].company; }
  }
  try {
    const result = await pool.query(
      `INSERT INTO service_provider_visits (provider_id,visitor_name,company,reason,employee_id,notes,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [provider_id||null, name, comp, reason, employee_id||null, notes, req.user.id]
    );
    const visit = result.rows[0];
    if (req.file) await saveImageToDB(req.file, 'provider_visit', visit.id);
    res.status(201).json(visit);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/providers/visits/:id
router.put('/visits/:id', authenticate, audit('UPDATE','provider_visit'), async (req, res) => {
  const { exit_time, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE service_provider_visits SET exit_time=COALESCE($1,NOW()), notes=COALESCE($2,notes), updated_at=NOW() WHERE id=$3 RETURNING *`,
      [exit_time||null, notes||null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
