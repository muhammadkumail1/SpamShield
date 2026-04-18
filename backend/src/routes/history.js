const express = require('express');
const { getHistory } = require('../services/historyStore');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const history = await getHistory({ page, limit });
    res.json(history);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
