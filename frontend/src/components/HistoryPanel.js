import React from 'react';
import './HistoryPanel.css';

export default function HistoryPanel({ history, onReload }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="history-panel">
      <div className="history-header">
        <div className="panel-title-row">
          <div className="panel-icon" style={{ background: 'rgba(255,170,0,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(255,170,0,0.2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h18v18H3zM3 9h18M9 21V9"/>
            </svg>
          </div>
          <h2 className="panel-title">Analysis History</h2>
        </div>
        <span className="history-count">{history.length} records</span>
      </div>
      <div className="history-list">
        {history.map((item, i) => (
          <div key={i} className="history-row" onClick={() => onReload(item)}>
            <div className={`history-verdict ${item.verdict === 'SPAM' ? 'spam' : 'ham'}`}>
              {item.verdict === 'SPAM' ? '🚫' : '✅'}
            </div>
            <div className="history-info">
              <div className="history-preview">
                {item.emailText.slice(0, 55)}{item.emailText.length > 55 ? '…' : ''}
              </div>
              <div className="history-meta">
                <span>{item.source}</span>
                <span>·</span>
                <span>{item.result.wordCount} words</span>
                <span>·</span>
                <span>{item.result.confidence}% conf.</span>
              </div>
            </div>
            <div className={`history-badge ${item.verdict === 'SPAM' ? 'spam' : 'ham'}`}>
              {item.verdict}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
