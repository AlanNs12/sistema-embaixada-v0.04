require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- MIDDLEWARE ----
app.use(cors({
  origin: true, // aceita qualquer origem (ajuste em produção)
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ---- ROUTES ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/outsourced', require('./routes/outsourced'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/providers', require('./routes/serviceProviders'));
app.use('/api/consular', require('./routes/consular'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api', require('./routes/dashboard')); // /api/dashboard, /api/info, /api/reports

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Embassy API running on http://localhost:${PORT}`);
});