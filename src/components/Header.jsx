import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchSeries } from '../api/fred';
import { ChevronLeft, Search, X } from 'lucide-react';

export default function Header() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const abortRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    searchSeries(trimmed, { limit: 6 })
      .then(data => {
        if (!controller.signal.aborted) {
          setSuggestions(data.series);
          setShowDropdown(data.series.length > 0);
          setActiveIndex(-1);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setShowDropdown(false);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(debouncedSearch, 400);
    return () => {
      clearTimeout(timer);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [debouncedSearch]);

  // Close dropdown on route change
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  const selectSeries = (seriesId) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/series/${seriesId}`);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSeries(suggestions[activeIndex].id);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const showBack = location.pathname !== '/';

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          {showBack && (
            <button className="header-back" onClick={() => navigate(-1)} aria-label="Go back">
              <ChevronLeft size={20} />
            </button>
          )}
          <span className="header-logo" onClick={() => navigate('/')}>FRED</span>
        </div>
        <form className="header-search" onSubmit={handleSearch}>
          <Search className="search-icon" size={16} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            placeholder="Search economic data..."
            className="search-input"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus(); }}
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}
          {showDropdown && (
            <div className="search-dropdown" ref={dropdownRef}>
              {loading && suggestions.length === 0 ? (
                <div className="search-dropdown-loading">Searching...</div>
              ) : (
                <>
                  {suggestions.map((s, i) => (
                    <div
                      key={s.id}
                      className={`search-dropdown-item ${i === activeIndex ? 'active' : ''}`}
                      onMouseDown={() => selectSeries(s.id)}
                      onMouseEnter={() => setActiveIndex(i)}
                    >
                      <span className="search-dropdown-id">{s.id}</span>
                      <span className="search-dropdown-title">{s.title}</span>
                    </div>
                  ))}
                  <div className="search-dropdown-footer" onMouseDown={handleSearch}>
                    View all results for "{query.trim()}"
                  </div>
                </>
              )}
            </div>
          )}
          {loading && query.trim().length >= 3 && (
            <div className="search-spinner" />
          )}
        </form>
      </div>
    </header>
  );
}
