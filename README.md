# SpamShield

An email spam detection platform built as a three-step guided workflow. Paste an email, watch it move through a live processing pipeline, and get a verdict backed by a simulated three-model ensemble (Naïve Bayes, Logistic Regression, SVM).

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Analysis Pipeline](#analysis-pipeline)

---

## Features

- **Three-step workflow** — email input → live pipeline view → final verdict
- **Real-time streaming** — pipeline stage progress delivered over Server-Sent Events
- **Ensemble scoring** — three independent model scores combined into a single confidence value
- **Signal extraction** — spam and legitimate keyword signals highlighted alongside tokenized output
- **Persistent history** — every analysis is saved to a local JSON store and shown in the history panel
- **Local fallback** — if the backend is unreachable, the frontend runs a heuristic analysis entirely in the browser

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Browser (React SPA)                 │
│                                                      │
│  EmailInputPanel → PipelineDisplay → ResultPanel     │
│       │                  │                           │
│  POST /api/analyze   EventSource                     │
│       │            /api/jobs/stream/:jobId           │
└───────┼──────────────────┼───────────────────────────┘
        │                  │
        ▼                  ▼
┌──────────────────────────────────────────────────────┐
│               Express API  (port 5000)               │
│                                                      │
│  POST /api/analyze                                   │
│    └─► createJob()  ──► runAnalysisJob() [async]     │
│              │                │                      │
│         jobStore           9-stage pipeline loop     │
│         (Map + EventEmitter)  │                      │
│                           analyzeEmailText()         │
│                               │                      │
│                           addHistory()               │
│                               │                      │
│                         data/history.json            │
│                                                      │
│  GET /api/jobs/stream/:jobId                         │
│    └─► SSE — emits stage_start, stage_done, complete │
│                                                      │
│  GET /api/jobs/:jobId   ── in-memory job state       │
│  GET /api/history       ── paginated JSON file read  │
│  GET /api/health        ── uptime + history count    │
└──────────────────────────────────────────────────────┘
```

### Request flow

1. The browser sends `POST /api/analyze` with the email text and source.
2. The server creates a job (UUID, queued status) and immediately returns `202 Accepted` with the job ID and stream URL.
3. `runAnalysisJob` runs asynchronously: it loops through the nine pipeline stages, sleeping for each stage's duration and emitting `stage_start` / `stage_done` events via an in-memory `EventEmitter`.
4. After all stages complete, `analyzeEmailText` scores the text and the result is persisted to `data/history.json`.
5. A final `complete` event is emitted with the full result payload.
6. The frontend, subscribed via `EventSource`, receives every event and drives the UI in real time.

---

## Project Structure

```
spamshield/
├── backend/
│   ├── index.js                  # Entry point — starts the Express server
│   ├── data/
│   │   └── history.json          # Persisted analysis history
│   └── src/
│       ├── app.js                # App factory — middleware, routes, error handlers
│       ├── config/
│       │   └── env.js            # Environment variables with defaults
│       ├── middleware/
│       │   └── errorHandler.js   # 404 and generic error handlers
│       ├── routes/
│       │   ├── analyze.js        # POST /api/analyze
│       │   ├── health.js         # GET  /api/health
│       │   ├── history.js        # GET  /api/history
│       │   └── jobs.js           # GET  /api/jobs/:id  +  SSE stream
│       ├── services/
│       │   ├── analysisService.js  # Pipeline stages + scoring logic
│       │   ├── historyStore.js     # JSON file read/write with in-memory cache
│       │   └── jobStore.js         # In-memory job Map + EventEmitter
│       └── tests/
│           └── analysisService.test.js
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js                # Root component — page routing and state
        ├── utils/
        │   └── analyzer.js       # API calls, SSE handling, local fallback
        └── components/
            ├── Header.js         # Top nav + analysis counter
            ├── EmailInputPanel.js  # Text input, source selector, sample loader
            ├── PipelineDisplay.js  # Live stage list + stdout log
            ├── ResultPanel.js    # Verdict banner, model bars, token display
            ├── HistoryPanel.js   # Recent analyses sidebar
            └── StatsBar.js       # Spam rate and confidence summary
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Recharts |
| Backend | Node.js, Express 5 |
| Security | Helmet, express-rate-limit, CORS |
| Streaming | Server-Sent Events (SSE) via Node `EventEmitter` |
| Persistence | JSON flat file (`data/history.json`) |
| Logging | Morgan |
| Testing | Node.js built-in `node:test` |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher

### Backend

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

### Environment variables (optional)

Create a `.env` file inside `backend/` to override any defaults:

```
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
MAX_HISTORY_ITEMS=250
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
```

### Running tests

```bash
cd backend
npm test
```

---

## API Reference

### `POST /api/analyze`

Start an analysis job.

**Request body**
```json
{
  "text": "Congratulations! You have been selected as a winner...",
  "source": "gmail"
}
```

**Response — `202 Accepted`**
```json
{
  "jobId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "status": "queued",
  "streamUrl": "/api/jobs/stream/f47ac10b-...",
  "statusUrl": "/api/jobs/f47ac10b-..."
}
```

---

### `GET /api/jobs/stream/:jobId`  *(Server-Sent Events)*

Stream live pipeline progress for a job.

```
event: connected
data: {"jobId": "...", "status": "queued"}

event: stage_start
data: {"stage": "tokenize", "index": 2, "label": "Tokenization", "description": "..."}

event: stage_done
data: {"stage": "tokenize", "index": 2, "completedStages": ["ingest", "sanitize", "tokenize"]}

event: complete
data: {"verdict": "SPAM", "confidence": 91, "ensemble": 88, "models": {...}, "tokens": [...]}
```

---

### `GET /api/jobs/:jobId`

Poll the current state of a job (fallback for when SSE is unavailable).

---

### `GET /api/history?page=1&limit=10`

Return paginated analysis history from the JSON store.

**Response**
```json
{
  "items": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

---

### `GET /api/health`

```json
{
  "status": "ok",
  "service": "spamshield-api",
  "uptimeSeconds": 320,
  "historyCount": 42,
  "timestamp": "2026-04-29T10:00:00.000Z"
}
```

---

## Analysis Pipeline

Each analysis runs through nine sequential stages. The frontend displays each stage as it progresses.

| # | Stage | Description |
|---|---|---|
| 1 | Email Ingestion | Receive raw email payload |
| 2 | Sanitization | Strip HTML tags and metadata |
| 3 | Tokenization | Split text into individual tokens |
| 4 | Stopword Removal | Filter common low-signal words |
| 5 | Normalization | Reduce words to consistent base forms |
| 6 | Vectorization | Generate weighted TF-IDF feature scores |
| 7 | Model Inference | Score text with NB, LR, and SVM models |
| 8 | Ensemble Voting | Average the three model probabilities |
| 9 | Classification Result | Produce final verdict and confidence |

The final verdict is **SPAM** if the ensemble score is ≥ 50, otherwise **LEGITIMATE**. Confidence is reported as how far the ensemble score sits from the 50 % threshold.

