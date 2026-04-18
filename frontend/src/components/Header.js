import React from 'react';
import './Header.css';

const NAV_ITEMS = [
  { id: 'input', label: 'Email Desk' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'result', label: 'Final Report' },
];

export default function Header({ analysisCount, currentPage, onNavigate }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>
          <div>
            <div className="header-title">SpamShield Studio</div>
            <div className="header-subtitle">Inbox Triage Workspace</div>
          </div>
        </div>

        <nav className="header-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`header-nav-btn ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-meta">
          <div className="header-stat">
            <span className="header-stat-value">{analysisCount.toLocaleString()}</span>
            <span className="header-stat-label">Analyses</span>
          </div>
          <div className="header-badge">
            <span>3 Steps</span>
            <span>Guided Review</span>
          </div>
        </div>
      </div>
    </header>
  );
}
