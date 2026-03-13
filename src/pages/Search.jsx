import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchSeries } from '../api/fred';
import SeriesCard from '../components/SeriesCard';
import Loading, { ErrorMessage } from '../components/Loading';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    async function search() {
      setLoading(true);
      setError(null);
      setOffset(0);
      try {
        const data = await searchSeries(query, { limit: 50, offset: 0 });
        if (cancelled) return;
        setResults(data.series);
        setTotal(data.count);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    search();
    return () => { cancelled = true; };
  }, [query]);

  const loadMore = async () => {
    const newOffset = offset + 50;
    try {
      const data = await searchSeries(query, { limit: 50, offset: newOffset });
      setResults(prev => [...prev, ...data.series]);
      setOffset(newOffset);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!query) {
    return (
      <div className="page">
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p>Search for economic data series</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page search-page">
      <h1 className="page-title">Results for "{query}"</h1>
      {total > 0 && <p className="results-count">{total.toLocaleString()} series found</p>}

      {loading && <Loading text="Searching..." />}
      {error && <ErrorMessage message={error} />}

      <div className="series-list">
        {results.map(s => <SeriesCard key={s.id} series={s} />)}
      </div>

      {results.length > 0 && results.length < total && (
        <button className="btn-secondary load-more" onClick={loadMore}>
          Load more ({results.length} of {total.toLocaleString()})
        </button>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="empty-state">
          <p>No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
