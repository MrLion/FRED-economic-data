import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReleases, getReleaseSeries } from '../api/fred';
import SeriesCard from '../components/SeriesCard';
import Loading, { ErrorMessage } from '../components/Loading';

export default function Releases() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (id) return <ReleaseDetail releaseId={Number(id)} />;
  return <ReleasesList />;
}

function ReleasesList() {
  const navigate = useNavigate();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getReleases({ limit: 200 });
        if (!cancelled) setReleases(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loading text="Loading releases..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="page releases-page">
      <h1 className="page-title">Releases</h1>
      <p className="page-subtitle">{releases.length} releases</p>
      <div className="category-list">
        {releases.map(rel => (
          <div
            key={rel.id}
            className="category-list-item"
            onClick={() => navigate(`/release/${rel.id}`)}
          >
            <span className="category-list-name">{rel.name}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReleaseDetail({ releaseId }) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getReleaseSeries(releaseId);
        if (!cancelled) setSeries(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [releaseId]);

  if (loading) return <Loading text="Loading series..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="page">
      <div className="series-list">
        {series.map(s => <SeriesCard key={s.id} series={s} />)}
      </div>
      {series.length === 0 && (
        <div className="empty-state"><p>No series in this release</p></div>
      )}
    </div>
  );
}
