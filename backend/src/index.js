require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/outsourced',require('./routes/outsourced'));
app.use('/api/vehicles',  require('./routes/vehicles'));
app.use('/api/providers', require('./routes/serviceProviders'));
app.use('/api/consular',  require('./routes/consular'));
app.use('/api/packages',  require('./routes/packages'));
app.use('/api/visitors',  require('./routes/visitors'));
app.use('/api/images',    require('./routes/images'));
app.use('/api',           require('./routes/dashboard'));

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Erro interno' });
});

app.listen(PORT, () =>
  console.log(`🚀 Embassy API [${process.env.NODE_ENV}] → http://localhost:${PORT}`));
