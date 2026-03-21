import { useState } from 'react';
import { setApiKey, setDemoKey } from '../api/fred';

export default function ApiKeyPrompt({ onSaved }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateAndSave = async (apiKey) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/fred/category?category_id=0&api_key=${encodeURIComponent(apiKey)}&file_type=json`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error_message || 'Invalid API key');
      }
      setApiKey(apiKey);
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to validate API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter your API key');
      return;
    }
    await validateAndSave(trimmed);
  };

  const handleDemo = () => {
    setDemoKey();
    onSaved();
  };

  return (
    <div className="api-key-overlay">
      <div className="api-key-card">
        <div className="api-key-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#003A70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>
        <h1>FRED Economic Data</h1>
        <p className="api-key-subtitle">
          Enter your free FRED API key to get started. You can obtain one at{' '}
          <a href="https://fred.stlouisfed.org/docs/api/api_key.html" target="_blank" rel="noopener noreferrer">
            fred.stlouisfed.org
          </a>
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(''); }}
            placeholder="Enter your FRED API key"
            className="api-key-input"
            autoFocus
            disabled={loading}
          />
          {error && <p className="api-key-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Validating...' : 'Connect to FRED'}
          </button>
        </form>
        <div className="api-key-divider">
          <span>or</span>
        </div>
        <button className="btn-demo" onClick={handleDemo}>
          Try Demo Mode
        </button>
        <p className="api-key-demo-hint">
          Explore the app instantly with a shared demo key
        </p>
      </div>
    </div>
  );
}
