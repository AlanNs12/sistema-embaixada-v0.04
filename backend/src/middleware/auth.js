const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Token não fornecido' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// viewer pode apenas ler — bloqueia escrita
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Acesso negado para este perfil' });
  next();
};

// Bloqueia viewers de qualquer mutação
const blockViewer = (req, res, next) => {
  if (req.user.role === 'viewer')
    return res.status(403).json({ error: 'Perfil de visualização não pode realizar alterações' });
  next();
};

module.exports = { authenticate, authorize, blockViewer };
