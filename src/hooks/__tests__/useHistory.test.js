import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

// Minimal React mock for hooks
let hookState;
vi.mock('react', () => ({
  useState: (init) => {
    if (hookState === undefined) {
      hookState = typeof init === 'function' ? init() : init;
    }
    return [hookState, (fn) => {
      hookState = typeof fn === 'function' ? fn(hookState) : fn;
    }];
  },
  useCallback: (fn) => fn,
}));

describe('useHistory', () => {
  beforeEach(() => {
    hookState = undefined;
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('loads empty array when localStorage is empty', async () => {
    const { useHistory } = await import('../useHistory.js');
    const { recentlyViewed } = useHistory();
    expect(recentlyViewed).toEqual([]);
  });

  it('loads existing history from localStorage', async () => {
    const existing = [{ id: 'GDP', title: 'GDP', frequency: 'Quarterly', viewedAt: 1 }];
    localStorageMock.setItem('fred_recently_viewed', JSON.stringify(existing));
    hookState = undefined;

    const { useHistory } = await import('../useHistory.js');
    const { recentlyViewed } = useHistory();
    expect(recentlyViewed).toEqual(existing);
  });

  it('addToHistory does not throw when localStorage.setItem fails', async () => {
    localStorageMock.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });
    hookState = undefined;

    const { useHistory } = await import('../useHistory.js');
    const { addToHistory } = useHistory();
    expect(() => addToHistory({ id: 'GDP', title: 'GDP', frequency: 'Q' })).not.toThrow();
  });

  it('clearHistory does not throw when localStorage.removeItem fails', async () => {
    localStorageMock.removeItem.mockImplementation(() => { throw new Error('storage error'); });
    hookState = undefined;

    const { useHistory } = await import('../useHistory.js');
    const { clearHistory } = useHistory();
    expect(() => clearHistory()).not.toThrow();
  });
});
