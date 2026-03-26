export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { endpoint, ...rest } = req.query || {};

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint parameter required' });
  }

  // Reject path traversal and absolute paths
  if (endpoint.includes('..') || endpoint.startsWith('/')) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'FRED API key not configured on server' });
  }

  const params = new URLSearchParams();
  params.set('api_key', apiKey);
  params.set('file_type', 'json');
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) params.set(k, String(v));
  });

  const url = `https://api.stlouisfed.org/fred/${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(url);
    const data = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', 'application/json');
    res.end(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach FRED API' });
  }
}
