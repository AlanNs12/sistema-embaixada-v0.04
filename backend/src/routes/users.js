const router = require('express').Router();
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// GET /api/users — super_admin vê todos; admin não vê super_admins de outros
router.get('/', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    let query, params = [];
    if (req.user.role === 'super_admin') {
      // super_admin vê todos exceto outros super_admins (a não ser ele mesmo)
      query = `SELECT id, name, email, role, active, created_at FROM users
               WHERE role != 'super_admin' OR id = $1 ORDER BY name`;
      params = [req.user.id];
    } else {
      // admin não vê super_admins
      query = `SELECT id, name, email, role, active, created_at FROM users
               WHERE role != 'super_admin' ORDER BY name`;
    }
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/users
router.post('/', authenticate, authorize('super_admin'), audit('CREATE', 'user'), async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  if (!['super_admin', 'admin', 'porteiro', 'viewer'].includes(role))
    return res.status(400).json({ error: 'Perfil inválido' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`,
      [name, email.toLowerCase(), hash, role]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email já cadastrado' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, authorize('super_admin'), audit('UPDATE', 'user'), async (req, res) => {
  const { name, email, role, active, password } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name=$1, email=$2, role=$3, active=$4, password_hash=$5, updated_at=NOW() WHERE id=$6`,
        [name, email.toLowerCase(), role, active, hash, req.params.id]);
    } else {
      await pool.query(
        `UPDATE users SET name=$1, email=$2, role=$3, active=$4, updated_at=NOW() WHERE id=$5`,
        [name, email.toLowerCase(), role, active, req.params.id]);
    }
    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/audit-logs — super_admin vê tudo; admin não vê ações de super_admins
router.get('/audit-logs', authenticate, authorize('super_admin', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 100, user_id } = req.query;
    const offset = (page - 1) * limit;
    let query = `SELECT al.*, u.email, u.role as user_role FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id WHERE 1=1`;
    const params = [];

    if (req.user.role !== 'super_admin') {
      // admin não vê logs de super_admins
      query += ` AND (u.role IS NULL OR u.role != 'super_admin')`;
    }
    if (user_id) {
      params.push(user_id);
      query += ` AND al.user_id = $${params.length}`;
    }
    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
