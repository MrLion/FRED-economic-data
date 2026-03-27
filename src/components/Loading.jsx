import { AlertTriangle } from 'lucide-react';

export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading">
      <div className="loading-spinner" />
      <p>{text}</p>
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="error-message">
      <AlertTriangle size={24} color="var(--error)" />
      <p>{message}</p>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-sm)' }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius }}
    />
  );
}

export function EmptyState({ icon: Icon, headline, body, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={48} />}
      {headline && <h3 className="empty-state-headline">{headline}</h3>}
      {body && <p className="empty-state-body">{body}</p>}
      {action}
    </div>
  );
}
