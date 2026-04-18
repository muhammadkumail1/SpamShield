import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';
import './ResultPanel.css';

function ConfidenceArc({ value, isSpam }) {
  const color = isSpam ? '#ff3b5c' : '#00ff88';
  const data = [
    { value: 100, fill: 'var(--bg-elevated)' },
    { value, fill: color },
  ];

  return (
    <div className="arc-container">
      <ResponsiveContainer width="100%" height={120}>
        <RadialBarChart
          cx="50%" cy="75%"
          innerRadius="60%" outerRadius="90%"
          startAngle={180} endAngle={0}
          data={data}
          barSize={12}
        >
          <RadialBar dataKey="value" cornerRadius={6} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="arc-label">
        <span className="arc-value" style={{ color }}>{value}%</span>
        <span className="arc-caption">Confidence</span>
      </div>
    </div>
  );
}

function ModelBar({ name, spamProb, isSpam }) {
  const hamProb = 100 - spamProb;
  return (
    <div className="model-bar-row">
      <span className="model-name">{name}</span>
      <div className="model-bar-track">
        <div
          className="model-bar-fill spam"
          style={{ width: `${spamProb}%` }}
          title={`Spam: ${spamProb}%`}
        />
        <div
          className="model-bar-fill ham"
          style={{ width: `${hamProb}%` }}
          title={`Ham: ${hamProb}%`}
        />
      </div>
      <div className="model-scores">
        <span className="score-spam">{spamProb}%</span>
        <span className="score-sep">/</span>
        <span className="score-ham">{hamProb}%</span>
      </div>
    </div>
  );
}

export default function ResultPanel({ result }) {
  if (!result) return null;

  const isSpam = result.verdict === 'SPAM';
  const accentColor = isSpam ? 'var(--accent-red)' : 'var(--accent-green)';
  const accentDim = isSpam ? 'var(--accent-red-dim)' : 'var(--accent-green-dim)';
  const accentBorder = isSpam
    ? 'rgba(255,59,92,0.25)'
    : 'rgba(0,255,136,0.25)';

  return (
    <div className="result-panel" style={{ '--result-accent': accentColor, '--result-dim': accentDim, '--result-border': accentBorder }}>

      {/* Verdict Banner */}
      <div className="verdict-banner" style={{ background: accentDim, borderColor: accentBorder }}>
        <div className="verdict-icon-wrap" style={{ background: isSpam ? 'rgba(255,59,92,0.15)' : 'rgba(0,255,136,0.15)', borderColor: accentBorder }}>
          {isSpam ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          )}
        </div>
        <div className="verdict-text">
          <div className="verdict-label">{isSpam ? 'SPAM DETECTED' : 'LEGITIMATE EMAIL'}</div>
          <div className="verdict-sub">
            {isSpam
              ? 'High probability of unsolicited or malicious content'
              : 'Classified as legitimate communication'}
          </div>
        </div>
        <div className="verdict-chip" style={{ color: accentColor, borderColor: accentBorder, background: 'transparent' }}>
          {isSpam ? '🚫 SPAM' : '✅ HAM'}
        </div>
      </div>

      {/* Confidence + Stats */}
      <div className="result-metrics-row">
        <div className="metrics-card">
          <ConfidenceArc value={result.confidence} isSpam={isSpam} />
        </div>
        <div className="meta-stats">
          <div className="meta-item">
            <span className="meta-label">Source</span>
            <span className="meta-value">{result.source}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Words</span>
            <span className="meta-value">{result.wordCount}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Characters</span>
            <span className="meta-value">{result.charCount}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Processed</span>
            <span className="meta-value">{new Date(result.processedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="section">
        <div className="section-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <rect x="9" y="9" width="6" height="6"/>
            <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
            <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
          </svg>
          Model Breakdown
          <span className="section-badge">Spam % / Ham %</span>
        </div>
        <div className="model-bars">
          <ModelBar name="Naïve Bayes" spamProb={result.models.naive_bayes.spam} isSpam={isSpam} />
          <ModelBar name="Logistic Regression" spamProb={result.models.logistic_regression.spam} isSpam={isSpam} />
          <ModelBar name="SVM" spamProb={result.models.svm.spam} isSpam={isSpam} />
        </div>
        <div className="ensemble-row">
          <span className="ensemble-label">Ensemble Vote</span>
          <div className="ensemble-bar-wrap">
            <div className="ensemble-bar" style={{ width: `${result.ensemble}%`, background: isSpam ? 'var(--accent-red)' : 'var(--accent-green)' }} />
          </div>
          <span className="ensemble-val" style={{ color: isSpam ? 'var(--accent-red)' : 'var(--accent-green)' }}>{result.ensemble}%</span>
        </div>
      </div>

      {/* Signal Tokens */}
      <div className="section">
        <div className="section-title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Extracted Tokens & Signals
        </div>
        <div className="tokens-area">
          {result.tokens.map((tok, i) => (
            <span key={i} className={`token ${result.spamSignals.includes(tok) ? 'spam' : result.hamSignals.includes(tok) ? 'ham' : 'neutral'}`}>
              {tok}
            </span>
          ))}
        </div>
        {(result.spamSignals.length > 0 || result.hamSignals.length > 0) && (
          <div className="signals-row">
            {result.spamSignals.length > 0 && (
              <div className="signal-group">
                <span className="signal-group-label spam">⚠ Spam Signals</span>
                {result.spamSignals.map((s, i) => (
                  <span key={i} className="signal-tag spam">{s}</span>
                ))}
              </div>
            )}
            {result.hamSignals.length > 0 && (
              <div className="signal-group">
                <span className="signal-group-label ham">✓ Legit Signals</span>
                {result.hamSignals.map((s, i) => (
                  <span key={i} className="signal-tag ham">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
