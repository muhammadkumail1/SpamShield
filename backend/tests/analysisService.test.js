const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeEmailText } = require('../src/services/analysisService');

test('flags obvious spam content', async () => {
  const result = await analyzeEmailText({
    text: 'Congratulations! Claim your free cash prize now by clicking this urgent winner link.',
    source: 'gmail',
  });

  assert.equal(result.verdict, 'SPAM');
  assert.ok(result.confidence >= 50);
  assert.ok(result.tokens.length > 0);
});

test('keeps ordinary work email as legitimate', async () => {
  const result = await analyzeEmailText({
    text: 'Hi team, please review the attached project update and share feedback by tomorrow.',
    source: 'outlook',
  });

  assert.equal(result.verdict, 'LEGITIMATE');
  assert.ok(result.wordCount > 0);
  assert.equal(result.source, 'outlook');
});
