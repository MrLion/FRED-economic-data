import { useState, useCallback } from 'react';
import { getAnthropicKey } from '../api/fred';
import { Sparkles, AlertTriangle, X, ChevronUp, ChevronDown } from 'lucide-react';

function computeDataSummary(observations) {
  if (!observations || observations.length === 0) return null;

  const values = observations.map(o => ({ date: o.date, value: Number(o.value) })).filter(o => !isNaN(o.value));
  if (values.length === 0) return null;

  const first = values[0];
  const last = values[values.length - 1];
  let min = values[0], max = values[0];
  for (const v of values) {
    if (v.value < min.value) min = v;
    if (v.value > max.value) max = v;
  }

  const overallChange = first.value !== 0
    ? (((last.value - first.value) / Math.abs(first.value)) * 100).toFixed(2)
    : 'N/A';

  // Year-over-year change (last value vs ~1 year ago)
  let yoyChange = 'N/A';
  const oneYearAgo = new Date(last.date);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const yoyPoint = values.reduce((closest, v) =>
    Math.abs(new Date(v.date) - oneYearAgo) < Math.abs(new Date(closest.date) - oneYearAgo) ? v : closest
  , values[0]);
  if (yoyPoint && yoyPoint.value !== 0 && yoyPoint.date !== last.date) {
    yoyChange = (((last.value - yoyPoint.value) / Math.abs(yoyPoint.value)) * 100).toFixed(2);
  }

  // Recent trend (last 5 data points)
  const recentN = Math.min(5, values.length);
  const recent = values.slice(-recentN);
  let trendDirection = 'flat';
  if (recent.length >= 2) {
    const recentFirst = recent[0].value;
    const recentLast = recent[recent.length - 1].value;
    const pctDiff = recentFirst !== 0 ? ((recentLast - recentFirst) / Math.abs(recentFirst)) * 100 : 0;
    if (pctDiff > 1) trendDirection = 'rising';
    else if (pctDiff < -1) trendDirection = 'falling';
  }

  const avg = (values.reduce((s, v) => s + v.value, 0) / values.length).toFixed(2);

  return `- Data points: ${values.length}
- Date range: ${first.date} to ${last.date}
- First value: ${first.value.toLocaleString()} (${first.date})
- Latest value: ${last.value.toLocaleString()} (${last.date})
- Minimum: ${min.value.toLocaleString()} (${min.date})
- Maximum: ${max.value.toLocaleString()} (${max.date})
- Average: ${Number(avg).toLocaleString()}
- Overall change: ${overallChange}%
- Year-over-year change: ${yoyChange}%
- Recent trend (last ${recentN} observations): ${trendDirection}
- Recent values: ${recent.map(r => `${r.value.toLocaleString()} (${r.date})`).join(', ')}`;
}

export default function AiNarrator({ series, observations }) {
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNarrative(null);

    try {
      const dataSummary = computeDataSummary(observations);
      if (!dataSummary) {
        setError('No data available to analyze.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: getAnthropicKey(),
          seriesId: series.id,
          seriesTitle: series.title,
          units: series.units || 'N/A',
          frequency: series.frequency || 'N/A',
          seasonalAdjustment: series.seasonal_adjustment || 'N/A',
          dataSummary,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError('Invalid Anthropic API key. Please check your key in Settings.');
        } else {
          setError(data.error || 'Failed to generate analysis.');
        }
        return;
      }

      setNarrative(data.narrative);
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [series, observations]);

  const handleDismiss = () => {
    setNarrative(null);
    setError(null);
    setCollapsed(false);
  };

  // No analysis yet — show button
  if (!narrative && !loading && !error) {
    return (
      <button className="ai-narrator-btn" onClick={handleAnalyze}>
        <Sparkles size={16} />
        Explain this chart
      </button>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="ai-narrator-card">
        <div className="ai-narrator-card-header">
          <Sparkles size={18} className="ai-narrator-icon" color="#0D9488" />
          <span className="ai-narrator-card-title">Analyzing...</span>
        </div>
        <div className="ai-narrator-skeleton">
          <div className="skeleton-line" style={{ width: '95%' }} />
          <div className="skeleton-line" style={{ width: '88%' }} />
          <div className="skeleton-line" style={{ width: '92%' }} />
          <div className="skeleton-line" style={{ width: '75%' }} />
          <div className="skeleton-line" style={{ width: '85%' }} />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="ai-narrator-card ai-narrator-error">
        <div className="ai-narrator-card-header">
          <AlertTriangle size={18} className="ai-narrator-icon" />
          <span className="ai-narrator-card-title">Analysis Error</span>
          <button className="ai-narrator-dismiss" onClick={handleDismiss} aria-label="Dismiss"><X size={14} /></button>
        </div>
        <p className="ai-narrator-text">{error}</p>
        <button className="ai-narrator-retry" onClick={handleAnalyze}>Try again</button>
      </div>
    );
  }

  // Success state — show narrative
  return (
    <div className="ai-narrator-card">
      <div className="ai-narrator-card-header">
        <Sparkles size={18} className="ai-narrator-icon" color="#0D9488" />
        <span className="ai-narrator-card-title">AI Analysis</span>
        <div className="ai-narrator-actions">
          <button
            className="ai-narrator-collapse"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button className="ai-narrator-dismiss" onClick={handleDismiss} aria-label="Dismiss"><X size={14} /></button>
        </div>
      </div>
      {!collapsed && (
        <div className="ai-narrator-narrative">
          {narrative.split('\n\n').map((para, i) => (
            <p key={i} className="ai-narrator-text">{para}</p>
          ))}
        </div>
      )}
    </div>
  );
}
