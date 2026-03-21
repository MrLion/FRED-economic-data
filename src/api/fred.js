const BASE_PATH = '/api/fred';
const DEMO_API_KEY = '311f23a1c836a93650d447f856d2d8b3';

function getApiKey() {
  return localStorage.getItem('fred_api_key') || '';
}

export function isDemoKey() {
  return getApiKey() === DEMO_API_KEY;
}

export function setDemoKey() {
  localStorage.setItem('fred_api_key', DEMO_API_KEY);
}

async function fredFetch(endpoint, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No API key configured');

  const searchParams = new URLSearchParams();
  searchParams.set('api_key', apiKey);
  searchParams.set('file_type', 'json');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) searchParams.set(k, String(v));
  });

  const res = await fetch(`${BASE_PATH}/${endpoint}?${searchParams.toString()}`);
  if (!res.ok) {
    if (res.status === 400) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error_message || 'Bad request — check your API key');
    }
    throw new Error(`FRED API error: ${res.status}`);
  }
  return res.json();
}

export async function getCategory(categoryId = 0) {
  return fredFetch('category', { category_id: categoryId });
}

export async function getCategoryChildren(categoryId = 0) {
  const data = await fredFetch('category/children', { category_id: categoryId });
  return data.categories || [];
}

export async function getCategorySeries(categoryId, opts = {}) {
  const data = await fredFetch('category/series', {
    category_id: categoryId,
    limit: opts.limit || 100,
    offset: opts.offset || 0,
    order_by: opts.order_by || 'popularity',
    sort_order: opts.sort_order || 'desc',
  });
  return { series: data.seriess || [], count: data.count || 0 };
}

export async function getSeries(seriesId) {
  const data = await fredFetch('series', { series_id: seriesId });
  return (data.seriess || [])[0] || null;
}

export async function getSeriesObservations(seriesId, opts = {}) {
  const data = await fredFetch('series/observations', {
    series_id: seriesId,
    limit: opts.limit || 100000,
    observation_start: opts.start,
    observation_end: opts.end,
    frequency: opts.frequency,
    units: opts.units,
  });
  return (data.observations || []).filter(o => o.value !== '.');
}

export async function searchSeries(query, opts = {}) {
  const data = await fredFetch('series/search', {
    search_text: query,
    limit: opts.limit || 50,
    offset: opts.offset || 0,
    order_by: opts.order_by || 'search_rank',
  });
  return { series: data.seriess || [], count: data.count || 0 };
}

export async function getSources() {
  const data = await fredFetch('sources', { limit: 1000, order_by: 'name' });
  return data.sources || [];
}

export async function getSourceReleases(sourceId) {
  const data = await fredFetch('source/releases', { source_id: sourceId, limit: 1000 });
  return data.releases || [];
}

export async function getReleases(opts = {}) {
  const data = await fredFetch('releases', {
    limit: opts.limit || 100,
    offset: opts.offset || 0,
    order_by: opts.order_by || 'name',
  });
  return data.releases || [];
}

export async function getReleaseSeries(releaseId) {
  const data = await fredFetch('release/series', {
    release_id: releaseId,
    limit: 200,
    order_by: 'popularity',
    sort_order: 'desc',
  });
  return data.seriess || [];
}

export function setApiKey(key) {
  localStorage.setItem('fred_api_key', key.trim());
}

export function hasApiKey() {
  return !!localStorage.getItem('fred_api_key');
}

export function clearApiKey() {
  localStorage.removeItem('fred_api_key');
}

// Anthropic API key management
export function getAnthropicKey() {
  return localStorage.getItem('anthropic_api_key') || '';
}

export function setAnthropicKey(key) {
  localStorage.setItem('anthropic_api_key', key.trim());
}

export function hasAnthropicKey() {
  return !!localStorage.getItem('anthropic_api_key');
}

export function clearAnthropicKey() {
  localStorage.removeItem('anthropic_api_key');
}
