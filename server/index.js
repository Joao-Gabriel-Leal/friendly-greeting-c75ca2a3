const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const appointmentsRoutes = require('./routes/appointments');
const professionalsRoutes = require('./routes/professionals');
const specialtiesRoutes = require('./routes/specialties');
const availabilityRoutes = require('./routes/availability');
const profilesRoutes = require('./routes/profiles');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080', 'https://agendamento.anadem.com.br'],
  credentials: true
}));
app.use(express.json());

// Test database connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Banco de dados conectado'))
  .catch(err => console.error('❌ Erro ao conectar ao banco:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/professionals', professionalsRoutes);
app.use('/api/specialties', specialtiesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 API disponível em http://localhost:${PORT}/api`);
});
