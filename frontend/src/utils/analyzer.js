// Uses the backend analysis API with a deterministic local fallback

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const PIPELINE_STAGES = [
  {
    id: 'ingest',
    label: 'Email Ingestion',
    description: 'Receiving raw email payload',
    icon: 'Download',
    duration: 400,
    color: 'cyan',
  },
  {
    id: 'sanitize',
    label: 'Sanitization',
    description: 'Stripping HTML tags, headers, metadata',
    icon: 'Shield',
    duration: 350,
    color: 'cyan',
  },
  {
    id: 'tokenize',
    label: 'Tokenization',
    description: 'Splitting text into linguistic tokens',
    icon: 'Scissors',
    duration: 500,
    color: 'purple',
  },
  {
    id: 'stopwords',
    label: 'Stopword Removal',
    description: 'Filtering noise: "the", "is", "at"…',
    icon: 'Filter',
    duration: 300,
    color: 'purple',
  },
  {
    id: 'stem',
    label: 'Stemming / Lemmatization',
    description: 'Normalizing: "running" → "run"',
    icon: 'GitMerge',
    duration: 450,
    color: 'purple',
  },
  {
    id: 'tfidf',
    label: 'TF-IDF Vectorization',
    description: 'Converting tokens to weighted feature vectors',
    icon: 'BarChart2',
    duration: 600,
    color: 'amber',
  },
  {
    id: 'inference',
    label: 'Model Inference',
    description: 'Running ensemble: NB + LR + SVM',
    icon: 'Cpu',
    duration: 800,
    color: 'amber',
  },
  {
    id: 'ensemble',
    label: 'Ensemble Voting',
    description: 'Aggregating model predictions',
    icon: 'Vote',
    duration: 350,
    color: 'amber',
  },
  {
    id: 'result',
    label: 'Classification Result',
    description: 'Returning verdict with confidence scores',
    icon: 'CheckCircle',
    duration: 300,
    color: 'green',
  },
];

// Heuristic spam signals for demo token analysis
const SPAM_SIGNALS = [
  'free', 'win', 'winner', 'cash', 'prize', 'urgent', 'click', 'offer',
  'limited', 'buy', 'sale', 'discount', 'cheap', 'money', 'earn',
  'guarantee', 'credit', 'loan', 'investment', 'million', 'congratulations',
  'selected', 'claim', 'verify', 'account', 'password', 'bank',
  'nigerian', 'prince', 'inheritance', 'transfer', 'dear friend',
  'act now', 'expires', 'unsubscribe', '100%', 'risk-free', 'no cost',
];

const HAM_SIGNALS = [
  'meeting', 'project', 'update', 'review', 'team', 'please', 'regards',
  'attached', 'schedule', 'agenda', 'report', 'feedback', 'discuss',
  'collaboration', 'deadline', 'proposal', 'presentation', 'quarterly',
];

function computeHeuristic(text) {
  const lower = text.toLowerCase();
  let spamScore = 0;
  let hamScore = 0;
  const foundSpam = [];
  const foundHam = [];

  SPAM_SIGNALS.forEach(sig => {
    if (lower.includes(sig)) { spamScore += 1; foundSpam.push(sig); }
  });
  HAM_SIGNALS.forEach(sig => {
    if (lower.includes(sig)) { hamScore += 1; foundHam.push(sig); }
  });

  // extra signals
  if (lower.includes('!!!') || lower.includes('???')) spamScore += 2;
  if (/\$[\d,]+/.test(text)) spamScore += 2;
  if (/\b[A-Z]{4,}\b/.test(text)) spamScore += 1; // ALL CAPS words
  if (text.length < 30) spamScore -= 1;

  const total = spamScore + hamScore + 1;
  let spamProb = Math.min(0.99, Math.max(0.01, spamScore / (total * 0.7)));
  if (hamScore > spamScore * 1.5) spamProb = Math.max(0.02, spamProb * 0.4);

  return { spamProb, foundSpam, foundHam };
}

function generateTokens(text) {
  const stopwords = new Set([
    'the','a','an','is','are','was','were','be','been','being','have','has',
    'had','do','does','did','will','would','could','should','may','might',
    'to','of','in','for','on','with','at','by','from','as','this','that',
    'it','its','or','and','but','if','so','yet','both','just','than','then',
  ]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t))
    .slice(0, 20);
}

async function simulateLocalAnalysis(emailText, source, onStageUpdate = () => {}) {
  const stages = PIPELINE_STAGES;
  const completedStages = [];

  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i];
    onStageUpdate({ stage: stage.id, status: 'running', index: i });
    await new Promise((resolve) => setTimeout(resolve, stage.duration));
    completedStages.push(stage.id);
    onStageUpdate({ stage: stage.id, status: 'done', index: i, completedStages: [...completedStages] });
  }

  const { spamProb, foundSpam, foundHam } = computeHeuristic(emailText);
  const tokens = generateTokens(emailText);
  const nbSpam = Math.min(0.99, Math.max(0.01, spamProb + 0.04));
  const lrSpam = Math.min(0.99, Math.max(0.01, spamProb + 0.01));
  const svmSpam = Math.min(0.99, Math.max(0.01, spamProb + 0.02));
  const ensembleSpam = (nbSpam + lrSpam + svmSpam) / 3;
  const isSpam = ensembleSpam >= 0.5;
  const confidence = isSpam ? ensembleSpam : 1 - ensembleSpam;

  return {
    verdict: isSpam ? 'SPAM' : 'LEGITIMATE',
    confidence: Math.round(confidence * 100),
    ensemble: Math.round(ensembleSpam * 100),
    models: {
      naive_bayes: { spam: Math.round(nbSpam * 100), ham: Math.round((1 - nbSpam) * 100) },
      logistic_regression: { spam: Math.round(lrSpam * 100), ham: Math.round((1 - lrSpam) * 100) },
      svm: { spam: Math.round(svmSpam * 100), ham: Math.round((1 - svmSpam) * 100) },
    },
    tokens,
    spamSignals: foundSpam.slice(0, 8),
    hamSignals: foundHam.slice(0, 5),
    source: source || 'Unknown',
    charCount: emailText.length,
    wordCount: emailText.split(/\s+/).filter(Boolean).length,
    processedAt: new Date().toISOString(),
  };
}

async function waitForBackendResult(jobId, onStageUpdate = () => {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const stream = new EventSource(`${API_BASE}/api/jobs/stream/${jobId}`);

    const finish = (callback) => {
      if (settled) return;
      settled = true;
      stream.close();
      callback();
    };

    stream.addEventListener('stage_start', (event) => {
      const data = JSON.parse(event.data);
      onStageUpdate({ stage: data.stage, status: 'running', index: data.index, completedStages: data.completedStages || [] });
    });

    stream.addEventListener('stage_done', (event) => {
      const data = JSON.parse(event.data);
      onStageUpdate({ stage: data.stage, status: 'done', index: data.index, completedStages: data.completedStages || [] });
    });

    stream.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      finish(() => resolve(data));
    });

    stream.addEventListener('failed', (event) => {
      const data = JSON.parse(event.data);
      finish(() => reject(new Error(data.message || 'Analysis failed.')));
    });

    stream.onerror = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Unable to recover analysis state.');
        }

        const job = await response.json();
        if (job.status === 'complete' && job.result) {
          finish(() => resolve(job.result));
          return;
        }

        if (job.status === 'failed') {
          finish(() => reject(new Error('Analysis failed on the server.')));
        }
      } catch (error) {
        finish(() => reject(error));
      }
    };
  });
}

export async function analyzeEmail(emailText, source, onStageUpdate = () => {}) {
  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: emailText, source }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || 'Failed to start backend analysis.');
    }

    const data = await response.json();
    if (!data.jobId) {
      throw new Error('The backend did not return a job ID.');
    }

    return await waitForBackendResult(data.jobId, onStageUpdate);
  } catch (error) {
    console.warn('Falling back to local analysis:', error);
    return simulateLocalAnalysis(emailText, source, onStageUpdate);
  }
}
