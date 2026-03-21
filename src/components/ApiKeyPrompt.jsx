import { useState, useCallback } from 'react';
import { setApiKey, setDemoKey } from '../api/fred';

function generateCaptcha() {
  const ops = [
    () => {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      return { question: `${a} + ${b}`, answer: a + b };
    },
    () => {
      const a = Math.floor(Math.random() * 20) + 5;
      const b = Math.floor(Math.random() * Math.min(a, 15)) + 1;
      return { question: `${a} - ${b}`, answer: a - b };
    },
    () => {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      return { question: `${a} × ${b}`, answer: a * b };
    },
  ];
  return ops[Math.floor(Math.random() * ops.length)]();
}

export default function ApiKeyPrompt({ onSaved }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const verifyCaptcha = useCallback(() => {
    const val = parseInt(captchaInput.trim(), 10);
    if (isNaN(val) || val !== captcha.answer) {
      setCaptchaError('Incorrect answer. Try again.');
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
      return false;
    }
    setCaptchaError('');
    return true;
  }, [captchaInput, captcha.answer]);

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
    if (!verifyCaptcha()) return;
    await validateAndSave(trimmed);
  };

  const handleDemo = () => {
    if (!verifyCaptcha()) return;
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

          <div className="captcha-box">
            <div className="captcha-challenge">
              <span className="captcha-label">Verify you're human:</span>
              <span className="captcha-question">{captcha.question} = ?</span>
            </div>
            <div className="captcha-input-row">
              <input
                type="text"
                inputMode="numeric"
                value={captchaInput}
                onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(''); }}
                placeholder="Answer"
                className="captcha-input"
                disabled={loading}
              />
              <button
                type="button"
                className="captcha-refresh"
                onClick={() => { setCaptcha(generateCaptcha()); setCaptchaInput(''); setCaptchaError(''); }}
                aria-label="New challenge"
                title="New challenge"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>
            {captchaError && <p className="api-key-error">{captchaError}</p>}
          </div>

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
