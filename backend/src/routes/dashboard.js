const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// ---- EMBASSY INFO ----

router.get('/info', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM embassy_info WHERE active=true ORDER BY category, sort_order, label');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/info', authenticate, authorize('super_admin','admin'), audit('CREATE','embassy_info'), async (req, res) => {
  const { category, label, value, description, sort_order } = req.body;
  if (!category || !label || !value) return res.status(400).json({ error: 'Categoria, rótulo e valor são obrigatórios' });
  try {
    const result = await pool.query(
      'INSERT INTO embassy_info (category,label,value,description,sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [category, label, value, description, sort_order||0]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/info/:id', authenticate, authorize('super_admin','admin'), audit('UPDATE','embassy_info'), async (req, res) => {
  const { category, label, value, description, sort_order, active } = req.body;
  try {
    await pool.query(
      'UPDATE embassy_info SET category=$1,label=$2,value=$3,description=$4,sort_order=$5,active=$6,updated_at=NOW() WHERE id=$7',
      [category, label, value, description, sort_order||0, active!==false, req.params.id]);
    res.json({ message: 'Atualizado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/info/:id', authenticate, authorize('super_admin'), audit('DELETE','embassy_info'), async (req, res) => {
  try {
    await pool.query('UPDATE embassy_info SET active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Removido' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---- DASHBOARD ----

router.get('/dashboard', authenticate, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [
      employeesIn, employeesOut, vehiclesOut,
      providersInside, consularInside, pendingPackages,
      outsourcedIn, visitorsInside,
    ] = await Promise.all([
      pool.query(
        `SELECT ea.*, e.name, e.position FROM employee_attendance ea
         JOIN employees e ON ea.employee_id=e.id
         WHERE ea.date=$1 AND ea.entry_time IS NOT NULL AND ea.exit_time IS NULL`, [today]),
      pool.query(
        `SELECT ea.*, e.name FROM employee_attendance ea
         JOIN employees e ON ea.employee_id=e.id
         WHERE ea.date=$1 AND ea.exit_time IS NOT NULL`, [today]),
      pool.query(
        `SELECT vl.*, v.plate, v.model FROM vehicle_logs vl
         JOIN vehicles v ON vl.vehicle_id=v.id
         WHERE vl.return_time IS NULL ORDER BY vl.departure_time`),
      pool.query(
        `SELECT spv.*, COALESCE(sp.name, spv.visitor_name) as name, COALESCE(sp.company, spv.company) as company
         FROM service_provider_visits spv
         LEFT JOIN service_providers sp ON spv.provider_id=sp.id
         WHERE spv.exit_time IS NULL ORDER BY spv.entry_time`),
      pool.query(
        `SELECT ca.*, e.name as employee_name FROM consular_appointments ca
         LEFT JOIN employees e ON ca.employee_id=e.id
         WHERE ca.exit_time IS NULL AND ca.entry_time IS NOT NULL`),
      pool.query(
        `SELECT p.*, e.name as recipient_employee_name FROM packages p
         LEFT JOIN employees e ON p.recipient_employee_id=e.id
         WHERE p.status='pending' ORDER BY p.received_at`),
      pool.query(
        `SELECT oa.*, ow.name, ow.role FROM outsourced_attendance oa
         JOIN outsourced_workers ow ON oa.worker_id=ow.id
         WHERE oa.date=$1 AND oa.entry_time IS NOT NULL AND oa.exit_time IS NULL`, [today]),
      pool.query(
        `SELECT vl.*, e.name as employee_name FROM visitor_logs vl
         LEFT JOIN employees e ON vl.employee_id=e.id
         WHERE vl.exit_time IS NULL AND vl.entry_time IS NOT NULL
         ORDER BY vl.entry_time DESC`),
    ]);

    res.json({
      employees_inside:     employeesIn.rows,
      employees_out_today:  employeesOut.rows,
      vehicles_out:         vehiclesOut.rows,
      providers_inside:     providersInside.rows,
      consular_inside:      consularInside.rows,
      pending_packages:     pendingPackages.rows,
      outsourced_inside:    outsourcedIn.rows,
      visitors_inside:      visitorsInside.rows,
      summary: {
        employees_in:      employeesIn.rowCount,
        vehicles_out:      vehiclesOut.rowCount,
        providers_inside:  providersInside.rowCount,
        pending_packages:  pendingPackages.rowCount,
      },
    });
  } catch (err) {
    console.error('❌ Dashboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---- REPORTS ----

router.get('/reports/:type', authenticate, async (req, res) => {
  const { type } = req.params;
  const start = req.query.start || new Date().toISOString().split('T')[0];
  const end   = req.query.end   || new Date().toISOString().split('T')[0];
  try {
    let result;
    switch (type) {
      case 'employee_attendance':
        result = await pool.query(
          `SELECT ea.*, e.name, e.position, e.department FROM employee_attendance ea
           JOIN employees e ON ea.employee_id=e.id
           WHERE ea.date BETWEEN $1 AND $2 ORDER BY ea.date DESC, e.name`, [start, end]); break;
      case 'outsourced_attendance':
        result = await pool.query(
          `SELECT oa.*, ow.name, ow.role, ow.company FROM outsourced_attendance oa
           JOIN outsourced_workers ow ON oa.worker_id=ow.id
           WHERE oa.date BETWEEN $1 AND $2 ORDER BY oa.date DESC, ow.name`, [start, end]); break;
      case 'vehicles':
        result = await pool.query(
          `SELECT vl.*, v.plate, v.model FROM vehicle_logs vl
           JOIN vehicles v ON vl.vehicle_id=v.id
           WHERE vl.date BETWEEN $1 AND $2 ORDER BY vl.date DESC, vl.departure_time`, [start, end]); break;
      case 'providers':
        result = await pool.query(
          `SELECT spv.*, COALESCE(sp.name, spv.visitor_name) as name,
                  COALESCE(sp.company, spv.company) as company, e.name as employee_name
           FROM service_provider_visits spv
           LEFT JOIN service_providers sp ON spv.provider_id=sp.id
           LEFT JOIN employees e ON spv.employee_id=e.id
           WHERE DATE(spv.entry_time) BETWEEN $1 AND $2 ORDER BY spv.entry_time DESC`, [start, end]); break;
      case 'consular':
        result = await pool.query(
          `SELECT ca.*, e.name as employee_name FROM consular_appointments ca
           LEFT JOIN employees e ON ca.employee_id=e.id
           WHERE ca.date BETWEEN $1 AND $2 ORDER BY ca.date DESC`, [start, end]); break;
      case 'packages':
        result = await pool.query(
          `SELECT p.*, e.name as recipient_name_emp, e2.name as delivered_to_emp
           FROM packages p
           LEFT JOIN employees e ON p.recipient_employee_id=e.id
           LEFT JOIN employees e2 ON p.delivered_to_id=e2.id
           WHERE DATE(p.received_at) BETWEEN $1 AND $2 ORDER BY p.received_at DESC`, [start, end]); break;
      case 'visitors':
        result = await pool.query(
          `SELECT vl.*, e.name as employee_name FROM visitor_logs vl
           LEFT JOIN employees e ON vl.employee_id=e.id
           WHERE vl.date BETWEEN $1 AND $2 ORDER BY vl.date DESC, vl.entry_time`, [start, end]); break;
      default:
        return res.status(400).json({ error: 'Tipo de relatório inválido' });
    }
    res.json({ type, start, end, count: result.rowCount, data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
