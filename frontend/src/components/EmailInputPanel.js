import React, { useState } from 'react';
import './EmailInputPanel.css';

const SOURCE_OPTIONS = [
  { value: 'gmail', label: 'Gmail', icon: '📧' },
  { value: 'outlook', label: 'Outlook', icon: '📨' },
  { value: 'yahoo', label: 'Yahoo Mail', icon: '📩' },
  { value: 'protonmail', label: 'ProtonMail', icon: '🔒' },
  { value: 'apple', label: 'Apple Mail', icon: '🍎' },
  { value: 'sms', label: 'SMS / Text', icon: '💬' },
  { value: 'other', label: 'Other', icon: '📋' },
];

const SAMPLE_SPAM = `Congratulations!!! You have been SELECTED as a WINNER of our $1,000,000 prize draw! 
Click here NOW to claim your FREE cash reward. This is a LIMITED TIME OFFER - act within 24 hours or lose your prize forever! 
Your account verification is required. Visit: http://claim-prize-now.xyz
Don't miss this once-in-a-lifetime opportunity! Call: 1-800-FREE-CASH`;

const SAMPLE_HAM = `Hi Sarah,

Just following up on our meeting from yesterday regarding the Q3 project timeline. 
I've attached the updated proposal with the revised milestones we discussed. 
Could you please review and share your feedback by Thursday?

Looking forward to your thoughts.

Best regards,
Michael
Engineering Lead`;

export default function EmailInputPanel({ onAnalyze, isLoading }) {
  const [emailText, setEmailText] = useState('');
  const [source, setSource] = useState('gmail');
  const [charCount, setCharCount] = useState(0);

  const handleTextChange = (e) => {
    setEmailText(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleSubmit = () => {
    if (emailText.trim().length < 5) return;
    onAnalyze(emailText, source);
  };

  const loadSample = (type) => {
    const text = type === 'spam' ? SAMPLE_SPAM : SAMPLE_HAM;
    setEmailText(text);
    setCharCount(text.length);
  };

  const clearAll = () => {
    setEmailText('');
    setCharCount(0);
  };

  return (
    <div className="input-panel">
      <div className="panel-header">
        <div className="panel-title-row">
          <div className="panel-icon cyan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 className="panel-title">Email Analysis Input</h2>
        </div>
        <div className="sample-buttons">
          <button className="sample-btn spam" onClick={() => loadSample('spam')}>
            Load Spam Sample
          </button>
          <button className="sample-btn ham" onClick={() => loadSample('ham')}>
            Load Legit Sample
          </button>
        </div>
      </div>

      {/* Source Selector */}
      <div className="source-section">
        <label className="field-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Email Source
        </label>
        <div className="source-grid">
          {SOURCE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`source-chip ${source === opt.value ? 'active' : ''}`}
              onClick={() => setSource(opt.value)}
            >
              <span className="chip-icon">{opt.icon}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Text Area */}
      <div className="textarea-section">
        <div className="textarea-header">
          <label className="field-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
            Email Body / Message Text
          </label>
          <div className="textarea-meta">
            <span className={`char-count ${charCount > 2000 ? 'warn' : ''}`}>
              {charCount.toLocaleString()} chars
            </span>
            {emailText && (
              <button className="clear-btn" onClick={clearAll} aria-label="Clear text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="textarea-wrapper">
          <div className="textarea-gutter">
            {emailText.split('\n').slice(0, 30).map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <textarea
            className="email-textarea"
            value={emailText}
            onChange={handleTextChange}
            placeholder="Paste your email text here…

Subject, headers, body — paste the full content for best accuracy."
            rows={12}
            aria-label="Email content to analyze"
          />
        </div>
        {emailText && (
          <div className="text-stats">
            <span>{emailText.split(/\s+/).filter(Boolean).length} words</span>
            <span>{emailText.split('\n').length} lines</span>
            <span>{emailText.split(/[.!?]+/).filter(Boolean).length} sentences</span>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        className={`analyze-btn ${isLoading ? 'loading' : ''} ${emailText.trim().length >= 5 ? 'ready' : 'disabled'}`}
        onClick={handleSubmit}
        disabled={isLoading || emailText.trim().length < 5}
      >
        {isLoading ? (
          <>
            <span className="btn-spinner" />
            <span>Analyzing Pipeline…</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
            </svg>
            <span>Analyze with AI Pipeline</span>
            <span className="btn-badge">3 Models</span>
          </>
        )}
      </button>
    </div>
  );
}
