import { useState } from 'react';
import { clearApiKey, hasAnthropicKey, getAnthropicKey, setAnthropicKey, clearAnthropicKey } from '../api/fred';

export default function Settings({ onLogout, clearHistory }) {
  const [anthropicKey, setAnthropicKeyState] = useState(getAnthropicKey());
  const [editing, setEditing] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const handleLogout = () => {
    clearApiKey();
    onLogout();
  };

  const handleSaveAnthropicKey = () => {
    const trimmed = keyInput.trim();
    if (trimmed) {
      setAnthropicKey(trimmed);
      setAnthropicKeyState(trimmed);
      setEditing(false);
      setKeyInput('');
    }
  };

  const handleClearAnthropicKey = () => {
    clearAnthropicKey();
    setAnthropicKeyState('');
  };

  const maskedKey = anthropicKey
    ? anthropicKey.substring(0, 7) + '...' + anthropicKey.substring(anthropicKey.length - 4)
    : '';

  return (
    <div className="page settings-page">
      <h1 className="page-title">Settings</h1>

      {/* AI Analysis Section */}
      <div className="settings-section">
        <h2 className="settings-section-title">AI Chart Analysis</h2>
        <p className="settings-section-desc">
          Add your Anthropic API key to enable AI-powered chart explanations.
          Get a key at <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>
        </p>

        {anthropicKey && !editing ? (
          <div className="settings-key-row">
            <span className="settings-key-value">{maskedKey}</span>
            <div className="settings-key-actions">
              <button className="btn-secondary btn-sm" onClick={() => { setEditing(true); setKeyInput(''); }}>
                Change
              </button>
              <button className="btn-secondary btn-sm btn-danger-text" onClick={handleClearAnthropicKey}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-key-input-row">
            <input
              type="password"
              className="settings-key-input"
              placeholder="sk-ant-..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveAnthropicKey()}
            />
            <button className="btn-primary btn-sm" onClick={handleSaveAnthropicKey} disabled={!keyInput.trim()}>
              Save
            </button>
            {editing && (
              <button className="btn-secondary btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* General Section */}
      <div className="settings-list">
        <button className="settings-item" onClick={clearHistory}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Clear recently viewed history</span>
        </button>
        <button className="settings-item danger" onClick={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Change FRED API Key</span>
        </button>
      </div>
    </div>
  );
}
