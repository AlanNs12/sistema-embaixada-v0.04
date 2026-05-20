const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isString().isLength({ min: 1, max: 128 }).withMessage('Senha inválida'),
  validate,
  async (req, res) => {
    console.log('🔐 Login attempt:', req.body?.email);
    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND active = true',
        [email.toLowerCase()]
      );
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      // Log login
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity, ip_address)
         VALUES ($1, $2, 'LOGIN', 'auth', $3)`,
        [user.id, user.name, req.ip]
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/password
router.put('/password',
  authenticate,
  body('currentPassword').isString().isLength({ min: 1, max: 128 }),
  body('newPassword').isLength({ min: 8, max: 128 }).withMessage('Mínimo 8 caracteres'),
  body('confirmPassword').custom((v, { req }) => v === req.body.newPassword)
    .withMessage('As senhas não coincidem'),
  validate,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const { rows } = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );
      const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });

      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hash, req.user.id]
      );
      await pool.query(
        `INSERT INTO audit_logs (user_id, user_name, action, entity, ip_address)
         VALUES ($1, $2, 'CHANGE_PASSWORD', 'auth', $3)`,
        [req.user.id, req.user.name, req.ip]
      );
      res.json({ message: 'Senha alterada com sucesso' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
