import { Trash2 } from 'lucide-react';

export default function Settings({ clearHistory }) {
  return (
    <div className="page settings-page">
      <h1 className="page-title">Settings</h1>

      <div className="settings-list">
        <button className="settings-item" onClick={clearHistory}>
          <Trash2 size={20} />
          <span>Clear recently viewed history</span>
        </button>
      </div>
    </div>
  );
}
