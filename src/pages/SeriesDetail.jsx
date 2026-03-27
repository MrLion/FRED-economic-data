import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSeries, getSeriesObservations } from '../api/fred';
import Chart from '../components/Chart';
import AiNarrator from '../components/AiNarrator';
import Loading, { ErrorMessage } from '../components/Loading';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

const RANGES = [
  { label: '1Y', years: 1 },
  { label: '5Y', years: 5 },
  { label: '10Y', years: 10 },
  { label: 'Max', years: null },
];

function DeltaChip({ current, prior }) {
  if (prior === 0 || prior == null || current == null) {
    return <span className="delta-chip delta-na">N/A</span>;
  }
  const delta = ((current - prior) / Math.abs(prior)) * 100;
  const isPositive = delta >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={`delta-chip ${isPositive ? 'delta-positive' : 'delta-negative'}`}>
      <Icon size={14} />
      {isPositive ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}

export default function SeriesDetail({ onView }) {
  const { id } = useParams();
  const [series, setSeries] = useState(null);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [range, setRange] = useState('Max');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [seriesData, obsData] = await Promise.all([
          getSeries(id),
          getSeriesObservations(id),
        ]);
        if (cancelled) return;
        setSeries(seriesData);
        setObservations(obsData);
        if (seriesData) {
          onView({ id: seriesData.id, title: seriesData.title, frequency: seriesData.frequency });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <Loading text="Loading series data..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!series) return <ErrorMessage message="Series not found" />;

  const filteredObs = (() => {
    const selected = RANGES.find(r => r.label === range);
    if (!selected?.years) return observations;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - selected.years);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return observations.filter(o => o.date >= cutoffStr);
  })();

  const latest = observations.length > 0 ? observations[observations.length - 1] : null;
  const prior = observations.length > 1 ? observations[observations.length - 2] : null;

  return (
    <div className="page series-detail-page">
      {/* Identity zone */}
      <div className="series-detail-header">
        <span className="series-detail-id">{series.id}</span>
        <h1 className="series-detail-title">{series.title}</h1>
      </div>

      {/* Hero number zone */}
      {latest && (
        <div className="series-detail-latest">
          <span className="latest-value">{Number(latest.value).toLocaleString()}</span>
          {series.units && <span className="latest-units">{series.units}</span>}
          <div className="latest-meta">
            <DeltaChip
              current={Number(latest.value)}
              prior={prior ? Number(prior.value) : null}
            />
            <span className="latest-date">{latest.date}</span>
          </div>
        </div>
      )}

      {/* Chart zone */}
      <div className="range-selector">
        {RANGES.map(r => (
          <button
            key={r.label}
            className={`range-btn ${range === r.label ? 'active' : ''}`}
            onClick={() => setRange(r.label)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Chart observations={filteredObs} title={series.title} />

      {/* Insight zone */}
      <AiNarrator series={series} observations={filteredObs} />

      {/* Provenance zone */}
      <div className="series-meta">
        <div className="meta-row">
          <span className="meta-label">Units</span>
          <span className="meta-value">{series.units || 'N/A'}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Frequency</span>
          <span className="meta-value">{series.frequency || 'N/A'}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Seasonal Adjustment</span>
          <span className="meta-value">{series.seasonal_adjustment || 'N/A'}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Last Updated</span>
          <span className="meta-value">{series.last_updated || 'N/A'}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Observation Range</span>
          <span className="meta-value">{series.observation_start} to {series.observation_end}</span>
        </div>
      </div>

      {series.notes && (
        <div className="series-notes">
          <h3>Notes</h3>
          <p>{series.notes}</p>
        </div>
      )}

      <a
        className="fred-link"
        href={`https://fred.stlouisfed.org/series/${series.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink size={14} />
        View on FRED
      </a>
    </div>
  );
}
