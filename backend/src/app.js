const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const analyzeRoutes = require('./routes/analyze');
const healthRoutes = require('./routes/health');
const historyRoutes = require('./routes/history');
const jobsRoutes = require('./routes/jobs');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  app.use(cors({
    origin: env.clientOrigin,
    credentials: false,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));

  app.get('/', (req, res) => {
    res.json({
      name: 'SpamShield API',
      status: 'running',
      docs: {
        health: '/api/health',
        analyze: '/api/analyze',
        history: '/api/history',
      },
    });
  });

  app.use('/api/health', healthRoutes);
  app.use(
    '/api/analyze',
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many analysis requests, please try again later.',
    }),
    analyzeRoutes
  );
  app.use('/api/history', historyRoutes);
  app.use('/api/jobs', jobsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
