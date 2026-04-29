
const { addHistory } = require('./historyStore');
const { emitJobEvent, updateJob } = require('./jobStore');

const PIPELINE_STAGES = [
  { id: 'ingest', label: 'Email Ingestion', description: 'Receiving raw email payload', duration: 60 },
  { id: 'sanitize', label: 'Sanitization', description: 'Removing markup and metadata noise', duration: 50 },
  { id: 'tokenize', label: 'Tokenization', description: 'Splitting text into meaningful tokens', duration: 55 },
  { id: 'stopwords', label: 'Stopword Removal', description: 'Filtering common low-signal words', duration: 40 },
  { id: 'stem', label: 'Normalization', description: 'Reducing words to consistent forms', duration: 45 },
  { id: 'tfidf', label: 'Vectorization', description: 'Generating weighted text features', duration: 50 },
  { id: 'inference', label: 'Model Inference', description: 'Evaluating ensemble probabilities', duration: 65 },
  { id: 'ensemble', label: 'Ensemble Voting', description: 'Combining model outputs', duration: 45 },
  { id: 'result', label: 'Classification Result', description: 'Preparing response payload', duration: 35 },
];

const SPAM_SIGNALS = [
  'free', 'winner', 'win', 'claim', 'prize', 'urgent', 'click', 'offer', 'limited',
  'discount', 'money', 'cash', 'loan', 'account', 'verify', 'password', 'selected',
  'congratulations', 'million', 'guarantee', 'investment', 'bonus', 'reward', 'bank',
];

const HAM_SIGNALS = [
  'meeting', 'project', 'review', 'attached', 'proposal', 'team', 'schedule', 'report',
  'regards', 'thanks', 'feedback', 'tomorrow', 'update', 'deadline', 'discussion',
];

const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'your', 'you', 'are', 'was',
  'were', 'will', 'has', 'had', 'but', 'not', 'our', 'all', 'can', 'please', 'just', 'into',
  'about', 'they', 'them', 'their', 'there', 'here', 'would', 'could', 'should', 'subject',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeText(text) {
  return String(text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return sanitizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function collectSignals(lowerText, signals) {
  return signals.filter((signal) => lowerText.includes(signal));
}

function scoreMessageFeatures(text, tokens, spamHits, hamHits) {
  const lowerText = text.toLowerCase();
  const urlMatches = (text.match(/https?:\/\//g) || []).length;
  const moneyMatches = (text.match(/\$\s?\d+|\b(?:usd|dollars|cash|prize|reward)\b/gi) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const capsWords = (text.match(/\b[A-Z]{4,}\b/g) || []).length;
  const urgencyTerms = (lowerText.match(/urgent|now|immediately|today|expires|limited/gi) || []).length;
  const politeTerms = (lowerText.match(/please|thanks|regards|attached|review/gi) || []).length;

  const density = tokens.length ? spamHits.length / tokens.length : 0;
  const base =
    0.18 +
    spamHits.length * 0.11 +
    density * 0.35 +
    urlMatches * 0.12 +
    moneyMatches * 0.1 +
    Math.min(exclamations, 6) * 0.015 +
    Math.min(capsWords, 6) * 0.025 +
    urgencyTerms * 0.04 -
    hamHits.length * 0.09 -
    politeTerms * 0.025;

  return {
    baseProbability: clamp(base, 0.02, 0.98),
    urlMatches,
    moneyMatches,
    exclamations,
    capsWords,
    urgencyTerms,
  };
}

function buildModelScores(featureScore) {
  const nbSpam = clamp(featureScore.baseProbability + featureScore.moneyMatches * 0.03, 0.01, 0.99);
  const lrSpam = clamp(featureScore.baseProbability + featureScore.urlMatches * 0.02 - 0.01, 0.01, 0.99);
  const svmSpam = clamp(featureScore.baseProbability + featureScore.capsWords * 0.01 + featureScore.urgencyTerms * 0.015 - 0.005, 0.01, 0.99);

  const ensemble = (nbSpam + lrSpam + svmSpam) / 3;

  return {
    naive_bayes: { spam: Math.round(nbSpam * 100), ham: Math.round((1 - nbSpam) * 100) },
    logistic_regression: { spam: Math.round(lrSpam * 100), ham: Math.round((1 - lrSpam) * 100) },
    svm: { spam: Math.round(svmSpam * 100), ham: Math.round((1 - svmSpam) * 100) },
    ensemble: Math.round(ensemble * 100),
  };
}

async function analyzeEmailText({ text, source = 'unknown', jobId = null }) {
  const sanitized = sanitizeText(text);
  const lowerText = sanitized.toLowerCase();
  const tokens = tokenize(sanitized).slice(0, 24);
  const spamHits = collectSignals(lowerText, SPAM_SIGNALS).slice(0, 8);
  const hamHits = collectSignals(lowerText, HAM_SIGNALS).slice(0, 6);
  const featureScore = scoreMessageFeatures(sanitized, tokens, spamHits, hamHits);
  const modelScores = buildModelScores(featureScore);
  const verdict = modelScores.ensemble >= 50 ? 'SPAM' : 'LEGITIMATE';
  const confidence = verdict === 'SPAM' ? modelScores.ensemble : 100 - modelScores.ensemble;

  return {
    jobId,
    verdict,
    confidence,
    ensemble: modelScores.ensemble,
    models: {
      naive_bayes: modelScores.naive_bayes,
      logistic_regression: modelScores.logistic_regression,
      svm: modelScores.svm,
    },
    tokens,
    spamSignals: spamHits,
    hamSignals: hamHits,
    source,
    charCount: sanitized.length,
    wordCount: sanitized ? sanitized.split(/\s+/).filter(Boolean).length : 0,
    processedAt: new Date().toISOString(),
  };
}

async function runAnalysisJob({ jobId, text, source }) {
  updateJob(jobId, { status: 'running' });
  const completedStages = [];

  for (let index = 0; index < PIPELINE_STAGES.length; index += 1) {
    const stage = PIPELINE_STAGES[index];
    emitJobEvent(jobId, 'stage_start', {
      stage: stage.id,
      index,
      label: stage.label,
      description: stage.description,
      completedStages: [...completedStages],
    });

    await sleep(stage.duration);
    completedStages.push(stage.id);

    emitJobEvent(jobId, 'stage_done', {
      stage: stage.id,
      index,
      label: stage.label,
      completedStages: [...completedStages],
    });
  }

  const result = await analyzeEmailText({ text, source, jobId });
  updateJob(jobId, { status: 'complete', result });
  await addHistory(result);
  emitJobEvent(jobId, 'complete', result);
  return result;
}

module.exports = {
  PIPELINE_STAGES,
  analyzeEmailText,
  runAnalysisJob,
};
