// backend/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const medicineRoutes = require('./routes/medicines');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { getDB } = require('./config/database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Initialize DB on startup
getDB();

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

app.use('/api/medicines', medicineRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 MediSafe API running on http://localhost:${PORT}`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/medicines`);
  console.log(`   GET  /api/medicines/stats`);
  console.log(`   GET  /api/medicines/alerts`);
  console.log(`   POST /api/medicines`);
  console.log(`   PUT  /api/medicines/:id`);
  console.log(`   DELETE /api/medicines/:id\n`);
});

module.exports = app;
