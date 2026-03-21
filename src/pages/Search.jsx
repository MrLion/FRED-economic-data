import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchSeries } from '../api/fred';
import { getAnthropicKey } from '../api/fred';
import SeriesCard from '../components/SeriesCard';
import Loading, { ErrorMessage } from '../components/Loading';

function isNaturalLanguage(query) {
  const q = query.toLowerCase().trim();
  const nlPatterns = /^(how|what|why|when|show|compare|tell|explain|find|which|where|is\s+there|are\s+there|has|have|did|does|do|can)\b/;
  const hasQuestionMark = q.includes('?');
  const wordCount = q.split(/\s+/).length;
  return nlPatterns.test(q) || hasQuestionMark || wordCount >= 5;
}

async function nlSearch(query) {
  const res = await fetch('/api/nl-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: getAnthropicKey(), query }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'NL search failed');
  return data;
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiTerms, setAiTerms] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    let cancelled = false;

    async function search() {
      setLoading(true);
      setError(null);
      setOffset(0);
      setAiExplanation(null);
      setAiTerms(null);

      const useNL = isNaturalLanguage(query);

      if (useNL) {
        // AI-powered natural language search
        setAiLoading(true);
        try {
          const nlResult = await nlSearch(query);
          if (cancelled) return;

          setAiExplanation(nlResult.explanation);
          setAiTerms(nlResult.searchTerms);
          setAiLoading(false);

          // Search FRED for each extracted term and merge results
          const terms = nlResult.searchTerms || [];
          if (terms.length === 0) {
            // Fallback to original query
            const data = await searchSeries(query, { limit: 50, offset: 0 });
            if (cancelled) return;
            setResults(data.series);
            setTotal(data.count);
          } else {
            const allResults = await Promise.all(
              terms.map(term => searchSeries(term, { limit: 20, offset: 0 }).catch(() => ({ series: [], count: 0 })))
            );
            if (cancelled) return;

            // Merge and deduplicate by series ID
            const seen = new Set();
            const merged = [];
            for (const data of allResults) {
              for (const s of data.series) {
                if (!seen.has(s.id)) {
                  seen.add(s.id);
                  merged.push(s);
                }
              }
            }
            setResults(merged);
            setTotal(merged.length);
          }
        } catch (err) {
          if (cancelled) return;
          setAiLoading(false);
          // Fallback to standard search on AI failure
          try {
            const data = await searchSeries(query, { limit: 50, offset: 0 });
            if (cancelled) return;
            setResults(data.series);
            setTotal(data.count);
          } catch (fallbackErr) {
            if (!cancelled) setError(fallbackErr.message);
          }
        }
      } else {
        // Standard FRED keyword search
        try {
          const data = await searchSeries(query, { limit: 50, offset: 0 });
          if (cancelled) return;
          setResults(data.series);
          setTotal(data.count);
        } catch (err) {
          if (!cancelled) setError(err.message);
        }
      }

      if (!cancelled) setLoading(false);
    }

    search();
    return () => { cancelled = true; };
  }, [query]);

  const loadMore = async () => {
    const newOffset = offset + 50;
    try {
      // For NL search, load more uses the first AI term or original query
      const searchQuery = aiTerms?.[0] || query;
      const data = await searchSeries(searchQuery, { limit: 50, offset: newOffset });
      setResults(prev => [...prev, ...data.series]);
      setOffset(newOffset);
      setTotal(data.count);
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
          <p style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
            Try natural language: "How has inflation changed since 2020?"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page search-page">
      <h1 className="page-title">Results for "{query}"</h1>

      {/* AI interpretation banner */}
      {aiLoading && (
        <div className="ai-search-banner ai-search-loading">
          <span className="ai-search-icon">&#10024;</span>
          <span>AI is interpreting your question...</span>
        </div>
      )}

      {aiExplanation && !aiLoading && (
        <div className="ai-search-banner">
          <span className="ai-search-icon">&#10024;</span>
          <div className="ai-search-content">
            <span className="ai-search-explanation">{aiExplanation}</span>
            {aiTerms && aiTerms.length > 0 && (
              <div className="ai-search-terms">
                {aiTerms.map((term, i) => (
                  <span key={i} className="ai-search-term">{term}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {total > 0 && <p className="results-count">{total.toLocaleString()} series found</p>}

      {loading && <Loading text="Searching..." />}
      {error && <ErrorMessage message={error} />}

      <div className="series-list">
        {results.map(s => <SeriesCard key={s.id} series={s} />)}
      </div>

      {!aiTerms && results.length > 0 && results.length < total && (
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
