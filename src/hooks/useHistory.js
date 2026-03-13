import { useState, useCallback } from 'react';

const STORAGE_KEY = 'fred_recently_viewed';
const MAX_ITEMS = 20;

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function useHistory() {
  const [items, setItems] = useState(load);

  const addToHistory = useCallback((series) => {
    setItems(prev => {
      const filtered = prev.filter(s => s.id !== series.id);
      const next = [
        { id: series.id, title: series.title, frequency: series.frequency, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return { recentlyViewed: items, addToHistory, clearHistory };
}
