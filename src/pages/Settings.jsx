import { clearApiKey } from '../api/fred';

export default function Settings({ onLogout, clearHistory }) {
  const handleLogout = () => {
    clearApiKey();
    onLogout();
  };

  return (
    <div className="page settings-page">
      <h1 className="page-title">Settings</h1>
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
          <span>Change API Key</span>
        </button>
      </div>
    </div>
  );
}
