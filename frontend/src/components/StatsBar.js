import React from 'react';
import './StatsBar.css';

export default function StatsBar({ history }) {
  const total = history.length;
  const spamCount = history.filter(h => h.verdict === 'SPAM').length;
  const hamCount = total - spamCount;
  const avgConf = total > 0
    ? Math.round(history.reduce((acc, h) => acc + h.result.confidence, 0) / total)
    : 0;
  const spamRate = total > 0 ? Math.round((spamCount / total) * 100) : 0;

  const stats = [
    { label: 'Total Analyzed', value: total, unit: '', color: 'cyan' },
    { label: 'Spam Detected', value: spamCount, unit: '', color: 'red' },
    { label: 'Legitimate', value: hamCount, unit: '', color: 'green' },
    { label: 'Spam Rate', value: spamRate, unit: '%', color: 'amber' },
    { label: 'Avg. Confidence', value: avgConf, unit: '%', color: 'purple' },
  ];

  return (
    <div className="stats-bar">
      {stats.map((s, i) => (
        <div key={i} className={`stat-item color-${s.color}`}>
          <span className="stat-value">{s.value}{s.unit}</span>
          <span className="stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
