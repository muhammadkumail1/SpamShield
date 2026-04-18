const fs = require('node:fs/promises');
const env = require('../config/env');

let cache = null;
let writeChain = Promise.resolve();

async function ensureLoaded() {
  if (cache) return cache;

  try {
    const raw = await fs.readFile(env.dataFile, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    cache = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      cache = [];
      await fs.writeFile(env.dataFile, '[]\n', 'utf8');
    } else {
      throw error;
    }
  }

  return cache;
}

function persistHistory(nextHistory) {
  writeChain = writeChain.then(() =>
    fs.writeFile(env.dataFile, `${JSON.stringify(nextHistory, null, 2)}\n`, 'utf8')
  );
  return writeChain;
}

async function addHistory(entry) {
  const history = await ensureLoaded();
  const nextHistory = [entry, ...history].slice(0, env.maxHistoryItems);
  cache = nextHistory;
  await persistHistory(nextHistory);
  return entry;
}

async function getHistory({ page = 1, limit = 10 } = {}) {
  const history = await ensureLoaded();
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
  const start = (safePage - 1) * safeLimit;
  const items = history.slice(start, start + safeLimit);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: history.length,
      totalPages: Math.max(1, Math.ceil(history.length / safeLimit)),
    },
  };
}

async function getHistoryCount() {
  const history = await ensureLoaded();
  return history.length;
}

module.exports = {
  addHistory,
  getHistory,
  getHistoryCount,
};
