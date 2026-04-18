const express = require('express');
const { getHistoryCount } = require('../services/historyStore');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const historyCount = await getHistoryCount();

    res.json({
      status: 'ok',
      service: 'spamshield-api',
      uptimeSeconds: Math.round(process.uptime()),
      historyCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
