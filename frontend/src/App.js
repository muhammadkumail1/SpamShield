import React, { useState, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import EmailInputPanel from './components/EmailInputPanel';
import PipelineDisplay from './components/PipelineDisplay';
import ResultPanel from './components/ResultPanel';
import HistoryPanel from './components/HistoryPanel';
import StatsBar from './components/StatsBar';
import { analyzeEmail, PIPELINE_STAGES } from './utils/analyzer';

const PAGES = [
  {
    id: 'input',
    step: '01',
    title: 'Email desk',
    description: 'Input area and analysis history',
  },
  {
    id: 'pipeline',
    step: '02',
    title: 'Processing flow',
    description: 'Live model stages and console',
  },
  {
    id: 'result',
    step: '03',
    title: 'Final report',
    description: 'Verdict and token signals',
  },
];

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [pipelineState, setPipelineState] = useState({ currentStageIndex: -1, completedStages: [] });
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [isPipelineComplete, setIsPipelineComplete] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [totalCount, setTotalCount] = useState(2847);
  const [currentPage, setCurrentPage] = useState('input');

  const handleAnalyze = useCallback(async (emailText, source) => {
    setIsLoading(true);
    setIsPipelineRunning(true);
    setIsPipelineComplete(false);
    setResult(null);
    setCurrentPage('pipeline');
    setPipelineState({ currentStageIndex: -1, completedStages: [] });

    try {
      const analysisResult = await analyzeEmail(
        emailText,
        source,
        ({ status, index, completedStages }) => {
          setPipelineState((prev) => ({
            currentStageIndex: status === 'running' ? index : prev.currentStageIndex,
            completedStages: completedStages || prev.completedStages,
          }));
        }
      );

      setIsPipelineComplete(true);
      setResult(analysisResult);
      setTotalCount((count) => count + 1);
      setHistory((prev) => [
        { emailText, source, verdict: analysisResult.verdict, result: analysisResult },
        ...prev.slice(0, 9),
      ]);
      setCurrentPage('result');
    } finally {
      setIsLoading(false);
      setIsPipelineRunning(false);
    }
  }, []);

  const handleReloadFromHistory = (item) => {
    setResult(item.result);
    setIsPipelineComplete(true);
    setIsPipelineRunning(false);
    setCurrentPage('result');
    setPipelineState({
      currentStageIndex: PIPELINE_STAGES.length - 1,
      completedStages: PIPELINE_STAGES.map((stage) => stage.id),
    });
  };

  const renderPage = () => {
    if (currentPage === 'input') {
      return (
        <section className="page-grid input-page">
          <div className="primary-stack">
            <EmailInputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>

          <aside className="secondary-stack">
            <div className="brief-card">
              <span className="brief-label">Step 1</span>
              <h3>Collect the email and review recent cases.</h3>
              <p>
                This page keeps the intake workflow focused: paste the message, choose its source,
                and reopen earlier analyses from the history panel.
              </p>
              <div className="quick-actions">
                <button className="ghost-btn strong" onClick={() => setCurrentPage('pipeline')}>
                  Open pipeline page
                </button>
              </div>
            </div>

            {history.length > 0 ? (
              <HistoryPanel history={history} onReload={handleReloadFromHistory} />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M4 4h16v16H4z" />
                    <path d="M8 8h8M8 12h8M8 16h5" />
                  </svg>
                </div>
                <div className="empty-title">No history yet</div>
                <div className="empty-desc">
                  Your recent analyses will appear here once you run the first email check.
                </div>
              </div>
            )}
          </aside>
        </section>
      );
    }

    if (currentPage === 'pipeline') {
      return (
        <section className="page-grid pipeline-page">
          <div className="primary-stack">
            <PipelineDisplay
              pipelineState={pipelineState}
              isRunning={isPipelineRunning}
              isComplete={isPipelineComplete}
            />
          </div>

          <aside className="secondary-stack">
            <div className="brief-card accent">
              <span className="brief-label">Step 2</span>
              <h3>Watch each processing stage in sequence.</h3>
              <p>
                Token cleanup, feature extraction, model voting, and final decisioning are separated
                onto their own page for a clearer review flow.
              </p>
              <div className="quick-actions">
                <button className="ghost-btn" onClick={() => setCurrentPage('input')}>
                  Back to email desk
                </button>
                <button
                  className="ghost-btn strong"
                  onClick={() => setCurrentPage(result ? 'result' : 'input')}
                >
                  {result ? 'View final report' : 'Return to input'}
                </button>
              </div>
            </div>

            {isPipelineComplete && result ? (
              <div className="mini-result-card">
                <span className="brief-label">Latest verdict</span>
                <div className={`mini-result ${result.verdict === 'SPAM' ? 'spam' : 'ham'}`}>
                  <strong>{result.verdict}</strong>
                  <span>{result.confidence}% confidence</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="empty-title">Pipeline waiting</div>
                <div className="empty-desc">
                  Start an analysis from the first page to see the live processing timeline here.
                </div>
              </div>
            )}
          </aside>
        </section>
      );
    }

    return (
      <section className="page-grid result-page">
        <div className="primary-stack">
          {result ? (
            <ResultPanel result={result} />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="empty-title">Final output will appear here</div>
              <div className="empty-desc">
                Run an analysis from the first page to generate the full report and confidence breakdown.
              </div>
            </div>
          )}
        </div>

        <aside className="secondary-stack">
          <div className="brief-card">
            <span className="brief-label">Step 3</span>
            <h3>
              {result
                ? result.verdict === 'SPAM'
                  ? 'Threat indicators were detected.'
                  : 'The message appears low risk.'
                : 'Awaiting a completed analysis.'}
            </h3>
            <p>
              {result
                ? `Source: ${result.source} • ${result.wordCount} words • ${result.charCount} characters`
                : 'The verdict, confidence score, model vote, and signal tokens will be shown after processing.'}
            </p>
            <div className="quick-actions">
              <button className="ghost-btn" onClick={() => setCurrentPage('input')}>
                Analyze another
              </button>
              <button className="ghost-btn strong" onClick={() => setCurrentPage('pipeline')}>
                Open pipeline
              </button>
            </div>
          </div>

          {history.length > 0 && <HistoryPanel history={history} onReload={handleReloadFromHistory} />}
        </aside>
      </section>
    );
  };

  return (
    <div className="app">
      <div className="bg-orb orb-a" aria-hidden="true" />
      <div className="bg-orb orb-b" aria-hidden="true" />
      <div className="bg-orb orb-c" aria-hidden="true" />

      <Header
        analysisCount={totalCount}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />

      <main className="main-content">
        {history.length > 0 && (
          <div className="stats-section">
            <StatsBar history={history.map((item) => ({ verdict: item.verdict, result: item.result }))} />
          </div>
        )}

        <section className="flow-nav" aria-label="Application sections">
          {PAGES.map((page) => (
            <button
              key={page.id}
              className={`flow-card ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(page.id)}
            >
              <span className="flow-step">{page.step}</span>
              <span className="flow-copy">
                <span className="flow-title">{page.title}</span>
                <span className="flow-desc">{page.description}</span>
              </span>
            </button>
          ))}
        </section>

        {renderPage()}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>SpamShield Studio</span>
          <span className="footer-sep">•</span>
          <span>Three-step email triage workflow</span>
          <span className="footer-sep">•</span>
          <span>FAST-NUCES Karachi</span>
        </div>
      </footer>
    </div>
  );
}
