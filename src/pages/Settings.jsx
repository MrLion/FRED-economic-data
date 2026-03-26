export default function Settings({ clearHistory }) {
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
      </div>
    </div>
  );
}
