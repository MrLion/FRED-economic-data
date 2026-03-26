import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../fred-proxy.js';

function mockReq(method, query = {}) {
  return { method, query };
}

function mockRes() {
  const res = {
    _status: 200,
    _headers: {},
    _body: null,
    status(code) { res._status = code; return res; },
    setHeader(k, v) { res._headers[k] = v; return res; },
    json(body) { res._body = body; return res; },
    end(body) { res._body = body; return res; },
  };
  return res;
}

describe('fred-proxy handler', () => {
  let originalKey;

  beforeEach(() => {
    originalKey = process.env.FRED_API_KEY;
    process.env.FRED_API_KEY = 'test-key-123';
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.FRED_API_KEY = originalKey;
    } else {
      delete process.env.FRED_API_KEY;
    }
    vi.restoreAllMocks();
  });

  it('rejects non-GET requests with 405', async () => {
    const res = mockRes();
    await handler(mockReq('POST'), res);
    expect(res._status).toBe(405);
    expect(res._body).toEqual({ error: 'Method not allowed' });
  });

  it('returns 400 when endpoint is missing', async () => {
    const res = mockRes();
    await handler(mockReq('GET', {}), res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'endpoint parameter required' });
  });

  it('rejects path traversal in endpoint', async () => {
    const res = mockRes();
    await handler(mockReq('GET', { endpoint: '../etc/passwd' }), res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'Invalid endpoint' });
  });

  it('rejects absolute paths in endpoint', async () => {
    const res = mockRes();
    await handler(mockReq('GET', { endpoint: '/etc/passwd' }), res);
    expect(res._status).toBe(400);
    expect(res._body).toEqual({ error: 'Invalid endpoint' });
  });

  it('returns 500 when FRED_API_KEY is not set', async () => {
    delete process.env.FRED_API_KEY;
    const res = mockRes();
    await handler(mockReq('GET', { endpoint: 'series' }), res);
    expect(res._status).toBe(500);
    expect(res._body).toEqual({ error: 'FRED API key not configured on server' });
  });

  it('forwards request to FRED API on success', async () => {
    const mockData = { seriess: [{ id: 'GDP' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(JSON.stringify(mockData)),
    }));

    const res = mockRes();
    await handler(mockReq('GET', { endpoint: 'series', series_id: 'GDP' }), res);

    expect(res._status).toBe(200);
    expect(fetch).toHaveBeenCalledOnce();
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('api.stlouisfed.org/fred/series');
    expect(calledUrl).toContain('api_key=test-key-123');
    expect(calledUrl).toContain('series_id=GDP');
    expect(calledUrl).toContain('file_type=json');
  });

  it('returns 502 on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const res = mockRes();
    await handler(mockReq('GET', { endpoint: 'series' }), res);
    expect(res._status).toBe(502);
    expect(res._body).toEqual({ error: 'Failed to reach FRED API' });
  });
});
