require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { initDB } = require('./db/database');
const authRoutes = require('./routes/auth');
const preEnrolementRoutes = require('./routes/preEnrolement');
const colisRoutes = require('./routes/colis');
const statistiquesRoutes = require('./routes/statistiques');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'COLITRACK API opérationnelle.', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// auth.js expose /register et /login -> montés directement sous /api
app.use('/api', authRoutes);
app.use('/api/pre-enrolement', preEnrolementRoutes);
app.use('/api', colisRoutes);
app.use('/api', statistiquesRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable.' });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`✅ COLITRACK API démarrée sur le port ${PORT}`);
  });
}

start();

module.exports = app;
