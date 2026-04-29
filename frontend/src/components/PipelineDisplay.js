import React from 'react';
import { PIPELINE_STAGES } from '../utils/analyzer';
import './PipelineDisplay.css';

const ICONS = {
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Scissors: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  ),
  Filter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  GitMerge: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <path d="M6 9v3a3 3 0 0 0 3 3h3"/>
      <line x1="6" y1="9" x2="6" y2="15"/>
    </svg>
  ),
  BarChart2: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Cpu: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  ),
  Vote: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

const COLOR_MAP = {
  cyan: { text: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', border: 'rgba(0,212,255,0.25)' },
  purple: { text: '#a78bfa', bg: 'rgba(124,58,237,0.12)', border: 'rgba(167,139,250,0.25)' },
  amber: { text: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', border: 'rgba(255,170,0,0.25)' },
  green: { text: 'var(--accent-green)', bg: 'var(--accent-green-dim)', border: 'rgba(0,255,136,0.25)' },
};

export default function PipelineDisplay({ pipelineState, isRunning, isComplete }) {
  const { currentStageIndex = -1, completedStages = [] } = pipelineState || {};

  const getStageStatus = (index) => {
    if (completedStages.includes(PIPELINE_STAGES[index]?.id)) return 'done';
    if (index === currentStageIndex && isRunning) return 'running';
    return 'pending';
  };

  const progress = isComplete
    ? 100
    : isRunning
    ? Math.round((completedStages.length / PIPELINE_STAGES.length) * 100)
    : 0;

  return (
    <div className="pipeline-panel">
      <div className="pipeline-header">
        <div className="panel-title-row">
          <div className="panel-icon" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <h2 className="panel-title">Processing Pipeline</h2>
        </div>
        <div className="pipeline-status-pill">
          {isComplete ? (
            <span className="pill complete">
              <span className="pill-dot green" />Complete
            </span>
          ) : isRunning ? (
            <span className="pill running">
              <span className="pill-dot cyan blink" />Running
            </span>
          ) : (
            <span className="pill idle">
              <span className="pill-dot grey" />Idle
            </span>
          )}
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-labels">
          <span>Pipeline Progress</span>
          <span className="progress-pct">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${isComplete ? 'complete' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="stage-tick-row">
          {PIPELINE_STAGES.map((_, i) => {
            const status = getStageStatus(i);
            return <div key={i} className={`stage-tick ${status}`} />;
          })}
        </div>
      </div>

      <div className="stages-list">
        {PIPELINE_STAGES.map((stage, index) => {
          const status = getStageStatus(index);
          const Icon = ICONS[stage.icon];
          const colors = COLOR_MAP[stage.color];

          return (
            <div key={stage.id} className={`stage-row ${status}`}>
              <div className="stage-connector">
                {index < PIPELINE_STAGES.length - 1 && (
                  <div className={`connector-line ${status === 'done' ? 'done' : ''}`} />
                )}
              </div>
              <div className="stage-node" style={status !== 'pending' ? {
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              } : {}}>
                {status === 'running' ? (
                  <span className="node-spinner" />
                ) : status === 'done' ? (
                  <Icon />
                ) : (
                  <span className="stage-number">{index + 1}</span>
                )}
              </div>
              <div className="stage-info">
                <div className="stage-label" style={status === 'running' ? { color: colors.text } : {}}>
                  {stage.label}
                </div>
                <div className={`stage-desc ${status === 'running' ? 'active' : ''}`}>
                  {status === 'running' ? (
                    <span className="typing-text">{stage.description}<span className="cursor-blink">_</span></span>
                  ) : (
                    stage.description
                  )}
                </div>
              </div>
              <div className="stage-badge">
                {status === 'done' && (
                  <span className="badge-done">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                )}
                {status === 'running' && (
                  <span className="badge-running">{stage.duration}ms</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {(isRunning || isComplete) && (
        <div className="log-console">
          <div className="log-header">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
            </svg>
            <span>stdout</span>
            {isRunning && <span className="log-live">LIVE</span>}
          </div>
          <div className="log-body">
            {completedStages.map((stageId, i) => {
              const stage = PIPELINE_STAGES.find(s => s.id === stageId);
              return (
                <div key={i} className="log-line">
                  <span className="log-time">{String(i).padStart(2,'0')}</span>
                  <span className="log-ok">[OK]</span>
                  <span className="log-msg">{stage?.label} — {stage?.description}</span>
                </div>
              );
            })}
            {isRunning && currentStageIndex >= 0 && (
              <div className="log-line current">
                <span className="log-time">{String(currentStageIndex).padStart(2,'0')}</span>
                <span className="log-run">[RUN]</span>
                <span className="log-msg">
                  {PIPELINE_STAGES[currentStageIndex]?.label}…
                  <span className="cursor-blink">▋</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
