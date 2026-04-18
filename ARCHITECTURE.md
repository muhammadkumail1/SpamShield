# SpamShield AI — Backend Architecture

## System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SpamShield AI — Architecture                    │
└────────────────────────────────────────────────────────────────────────┘

  [React Frontend]
       │
       │  POST /api/analyze        GET /api/health
       │  SSE  /api/stream/:jobId  GET /api/history
       ▼
  ┌─────────────────────────────────────┐
  │         Flask API Gateway           │
  │  app.py  |  routes/  |  middleware/ │
  │  CORS, rate limiting, JWT auth      │
  └────────────┬────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
  ┌──────────┐    ┌────────────┐
  │  Redis   │    │  Celery    │
  │  Queue   │───▶│  Workers   │
  │  Cache   │    │ (pipeline) │
  └──────────┘    └─────┬──────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │  Stage 1 │  │  Stage 2 │  │  Stage N │
   │  Ingest  │  │Preprocess│  │ Inference│
   └──────────┘  └──────────┘  └──────────┘
                        │
                        ▼
                ┌───────────────┐
                │  ML Pipeline  │
                │  naive_bayes  │
                │  log_reg      │
                │  svm          │
                │  ensemble     │
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │  PostgreSQL   │
                │  (results +   │
                │   audit log)  │
                └───────────────┘
```

---

## Directory Structure

```
spamshield-backend/
├── app.py                        # Flask app factory
├── config.py                     # Environment configs (dev/staging/prod)
├── requirements.txt
│
├── api/
│   ├── __init__.py
│   ├── routes/
│   │   ├── analyze.py            # POST /api/analyze
│   │   ├── stream.py             # GET  /api/stream/<job_id>  (SSE)
│   │   ├── history.py            # GET  /api/history
│   │   └── health.py             # GET  /api/health
│   └── middleware/
│       ├── auth.py               # JWT validation
│       ├── rate_limit.py         # Flask-Limiter
│       └── cors.py
│
├── pipeline/
│   ├── __init__.py
│   ├── orchestrator.py           # Runs all stages in order, emits SSE events
│   ├── stages/
│   │   ├── ingest.py             # Parse raw email text/headers
│   │   ├── sanitize.py           # Strip HTML, normalize encoding
│   │   ├── tokenize.py           # NLTK word_tokenize
│   │   ├── stopwords.py          # Remove stopwords
│   │   ├── stem.py               # PorterStemmer / WordNetLemmatizer
│   │   ├── vectorize.py          # TF-IDF transform (fitted vectorizer)
│   │   └── inference.py          # Run all 3 models + ensemble vote
│   └── models/
│       ├── loader.py             # Loads pickled models at startup
│       ├── naive_bayes.pkl       # Trained MultinomialNB
│       ├── logistic_regression.pkl
│       ├── svm.pkl               # LinearSVC
│       └── tfidf_vectorizer.pkl
│
├── ml/
│   ├── train.py                  # Full training script
│   ├── evaluate.py               # Prints accuracy/precision/recall/F1
│   ├── dataset/
│   │   └── spam.csv              # SMS Spam Collection (Kaggle)
│   └── notebooks/
│       └── exploration.ipynb     # EDA, word clouds, confusion matrix
│
├── tasks/
│   ├── celery_app.py             # Celery + Redis broker config
│   └── analyze_task.py           # Async task wrapper for pipeline
│
├── db/
│   ├── models.py                 # SQLAlchemy: AnalysisResult, AuditLog
│   ├── migrations/               # Alembic migrations
│   └── session.py
│
└── tests/
    ├── test_pipeline.py
    ├── test_api.py
    └── fixtures/
        ├── sample_spam.txt
        └── sample_ham.txt
```

---

## API Endpoints

### POST /api/analyze
Synchronous analysis (returns full result).

**Request:**
```json
{
  "text": "Congratulations! You've won $1,000,000...",
  "source": "gmail"
}
```

**Response:**
```json
{
  "verdict": "SPAM",
  "confidence": 94,
  "ensemble": 91,
  "models": {
    "naive_bayes":          { "spam": 93, "ham": 7 },
    "logistic_regression":  { "spam": 89, "ham": 11 },
    "svm":                  { "spam": 91, "ham": 9 }
  },
  "tokens": ["congratulations", "won", "million", "claim", "free"],
  "spam_signals": ["free", "win", "million", "claim"],
  "ham_signals": [],
  "char_count": 312,
  "word_count": 48,
  "processed_at": "2026-04-03T10:22:31Z",
  "job_id": "abc123"
}
```

---

### GET /api/stream/<job_id>  (Server-Sent Events)
Streams pipeline stage updates in real-time.

**Event stream format:**
```
event: stage_start
data: {"stage": "tokenize", "index": 2, "label": "Tokenization"}

event: stage_done
data: {"stage": "tokenize", "index": 2, "duration_ms": 48}

event: complete
data: {"verdict": "SPAM", "confidence": 94, ...}
```

Frontend subscribes with `EventSource('/api/stream/abc123')`.

---

### GET /api/history?page=1&limit=20
Returns paginated analysis history.

---

### GET /api/health
Returns system status: model loading state, Redis connectivity, DB status.

---

## ML Pipeline Detail

### Training (`ml/train.py`)

```python
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import pandas as pd, pickle

df = pd.read_csv('dataset/spam.csv', encoding='latin-1')[['v1','v2']]
df.columns = ['label','text']
df['label'] = df['label'].map({'spam':1,'ham':0})

X_train, X_test, y_train, y_test = train_test_split(
    df['text'], df['label'], test_size=0.2, random_state=42
)

vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1,2))
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec  = vectorizer.transform(X_test)

models = {
    'naive_bayes':         MultinomialNB(),
    'logistic_regression': LogisticRegression(max_iter=1000),
    'svm':                 LinearSVC(),
}

for name, model in models.items():
    model.fit(X_train_vec, y_train)
    print(name, classification_report(y_test, model.predict(X_test_vec)))
    pickle.dump(model, open(f'pipeline/models/{name}.pkl', 'wb'))

pickle.dump(vectorizer, open('pipeline/models/tfidf_vectorizer.pkl', 'wb'))
```

---

### Inference Ensemble (`pipeline/stages/inference.py`)

```python
import pickle, numpy as np

_models = {}
_vectorizer = None

def load_models():
    global _vectorizer
    for name in ['naive_bayes','logistic_regression','svm']:
        _models[name] = pickle.load(open(f'pipeline/models/{name}.pkl','rb'))
    _vectorizer = pickle.load(open('pipeline/models/tfidf_vectorizer.pkl','rb'))

def run_inference(tokens: list[str]) -> dict:
    text = ' '.join(tokens)
    vec  = _vectorizer.transform([text])
    scores = {}
    for name, model in _models.items():
        if hasattr(model, 'predict_proba'):
            prob = model.predict_proba(vec)[0][1]
        else:                                    # LinearSVC -> decision_function
            raw  = model.decision_function(vec)[0]
            prob = 1 / (1 + np.exp(-raw))        # sigmoid
        scores[name] = round(float(prob) * 100)
    ensemble = round(sum(scores.values()) / len(scores))
    return {'models': scores, 'ensemble': ensemble, 'verdict': 'SPAM' if ensemble >= 50 else 'LEGITIMATE'}
```

---

## Real-Time Pipeline (SSE via Redis PubSub)

```
Client ──SSE──► Flask /stream/<job_id>
                    │  subscribe Redis channel job:<job_id>
                    │
Celery Worker ──► pipeline/orchestrator.py
                    for each stage:
                        run stage
                        redis.publish(f'job:{job_id}', json.dumps({
                            'event': 'stage_done',
                            'stage': stage.id,
                            'index': i,
                        }))
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API Framework | Flask 3.x + Gunicorn |
| Async Tasks | Celery 5.x |
| Message Broker | Redis 7 |
| ML | scikit-learn 1.4 |
| NLP | NLTK 3.8 |
| ORM | SQLAlchemy 2.x |
| DB | PostgreSQL 16 |
| Auth | Flask-JWT-Extended |
| Rate Limiting | Flask-Limiter |
| Real-time | Server-Sent Events (SSE) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Docker Compose

```yaml
version: '3.9'
services:
  api:
    build: .
    ports: ["5000:5000"]
    depends_on: [redis, db]
    environment:
      DATABASE_URL: postgresql://user:pass@db/spamshield
      REDIS_URL: redis://redis:6379/0

  worker:
    build: .
    command: celery -A tasks.celery_app worker --loglevel=info
    depends_on: [redis, db]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: spamshield
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

---

## Expected Model Performance (SMS Spam Collection)

| Model | Accuracy | Precision | Recall | F1 |
|-------|----------|-----------|--------|----|
| Naïve Bayes | 97.8% | 96.1% | 94.3% | 95.2% |
| Logistic Reg. | 98.4% | 97.6% | 96.0% | 96.8% |
| SVM (Linear) | 98.7% | 98.2% | 96.5% | 97.3% |
| **Ensemble** | **98.9%** | **98.5%** | **97.1%** | **97.8%** |

---

*SpamShield AI — BCS 6B, FAST-NUCES Karachi*
*Fasih 23K-0017 | Muhammad Kumail 23K-0611*
*Instructor: Ms. Sadaf Zehra*
