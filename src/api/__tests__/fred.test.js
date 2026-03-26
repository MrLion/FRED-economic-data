import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('fred.js', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  describe('fredFetch proxy URL building', () => {
    it('builds correct proxy URL with endpoint and params', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ categories: [] }),
      }));

      const { getCategoryChildren } = await import('../fred.js');
      await getCategoryChildren(0);

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('/api/fred-proxy?');
      expect(calledUrl).toContain('endpoint=category%2Fchildren');
      expect(calledUrl).toContain('category_id=0');
      // Should NOT contain api_key
      expect(calledUrl).not.toContain('api_key');
    });
  });

  describe('searchSeries signal forwarding', () => {
    it('passes signal to fetch', async () => {
      const controller = new AbortController();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ seriess: [], count: 0 }),
      }));

      const { searchSeries } = await import('../fred.js');
      await searchSeries('GDP', {}, controller.signal);

      expect(fetch).toHaveBeenCalledOnce();
      const fetchOpts = fetch.mock.calls[0][1];
      expect(fetchOpts.signal).toBe(controller.signal);
    });
  });

  describe('getSeriesObservations', () => {
    it('uses 10000 as default limit', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ observations: [] }),
      }));

      const { getSeriesObservations } = await import('../fred.js');
      await getSeriesObservations('GDP');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('limit=10000');
    });
  });

  describe('Anthropic key localStorage error handling', () => {
    it('getAnthropicKey returns empty string on localStorage error', async () => {
      localStorageMock.getItem.mockImplementation(() => { throw new Error('quota exceeded'); });
      const { getAnthropicKey } = await import('../fred.js');
      expect(getAnthropicKey()).toBe('');
    });

    it('setAnthropicKey does not throw on localStorage error', async () => {
      localStorageMock.setItem.mockImplementation(() => { throw new Error('quota exceeded'); });
      const { setAnthropicKey } = await import('../fred.js');
      expect(() => setAnthropicKey('test-key')).not.toThrow();
    });

    it('hasAnthropicKey returns false on localStorage error', async () => {
      localStorageMock.getItem.mockImplementation(() => { throw new Error('quota exceeded'); });
      const { hasAnthropicKey } = await import('../fred.js');
      expect(hasAnthropicKey()).toBe(false);
    });

    it('clearAnthropicKey does not throw on localStorage error', async () => {
      localStorageMock.removeItem.mockImplementation(() => { throw new Error('quota exceeded'); });
      const { clearAnthropicKey } = await import('../fred.js');
      expect(() => clearAnthropicKey()).not.toThrow();
    });
  });
});
