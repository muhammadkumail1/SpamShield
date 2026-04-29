const path = require('node:path');

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  dataFile: path.join(__dirname, '../../data/history.json'),
  maxHistoryItems: parseInt(process.env.MAX_HISTORY_ITEMS || '250', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '120', 10),
};
