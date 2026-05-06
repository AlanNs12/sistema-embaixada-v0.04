require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Configurações vindas exclusivamente do .env ───────────────
const PORT         = process.env.BACKEND_PORT   || process.env.PORT || 3001;
const HOST         = process.env.BACKEND_HOST   || '127.0.0.1';
const NODE_ENV     = process.env.NODE_ENV        || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL    || 'http://localhost:5173';

// ── Security headers (helmet) ─────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Permite uso da câmera pelo navegador (scanner de código de barras)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*');
  next();
});

// ── Rate limiting no login: máx 10 tentativas / IP / 15 min ──
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── CORS: lista de origens autorizadas via .env ───────────────
// Em desenvolvimento pode ser http://localhost:5173
// Em produção deve ser a URL pública real (ex: https://seudominio.com)
const allowedOrigins = FRONTEND_URL
  .split(',')               // suporta múltiplas origens: URL1,URL2
  .map(u => u.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origin (Postman, apps mobile, mesmo servidor)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Em desenvolvimento libera localhost de qualquer porta
    if (NODE_ENV === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin))
      return callback(null, true);
    callback(new Error(`Origem não autorizada: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rotas ─────────────────────────────────────────────────────
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/employees',  require('./routes/employees'));
app.use('/api/outsourced', require('./routes/outsourced'));
app.use('/api/vehicles',   require('./routes/vehicles'));
app.use('/api/providers',  require('./routes/serviceProviders'));
app.use('/api/consular',   require('./routes/consular'));
app.use('/api/packages',   require('./routes/packages'));
app.use('/api/visitors',   require('./routes/visitors'));
app.use('/api/images',     require('./routes/images'));
app.use('/api',            require('./routes/dashboard'));

// env removido para não expor o ambiente do servidor
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message?.startsWith('Origem não autorizada')) {
    return res.status(403).json({ error: err.message });
  }
  res.status(500).json({ error: err.message || 'Erro interno' });
});

// ── Inicia servidor ───────────────────────────────────────────
app.listen(PORT, HOST, () => {
  console.log(`🚀 Embassy API [${NODE_ENV}] → http://${HOST}:${PORT}`);
  console.log(`   Origens CORS permitidas: ${allowedOrigins.join(', ')}`);
});
