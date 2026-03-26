const extractSeries = (d) => d.seriess || [];

async function fredFetch(endpoint, params = {}, signal) {
  const searchParams = new URLSearchParams();
  searchParams.set('endpoint', endpoint);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) searchParams.set(k, String(v));
  });

  const res = await fetch(`/api/fred-proxy?${searchParams.toString()}`, { signal });
  if (!res.ok) {
    if (res.status === 400) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error_message || data?.error || 'Bad request');
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
  return { series: extractSeries(data), count: data.count || 0 };
}

export async function getSeries(seriesId) {
  const data = await fredFetch('series', { series_id: seriesId });
  return extractSeries(data)[0] || null;
}

export async function getSeriesObservations(seriesId, opts = {}) {
  const data = await fredFetch('series/observations', {
    series_id: seriesId,
    limit: opts.limit || 10000,
    observation_start: opts.start,
    observation_end: opts.end,
    frequency: opts.frequency,
    units: opts.units,
  });
  return (data.observations || []).filter(o => o.value !== '.');
}

export async function searchSeries(query, opts = {}, signal) {
  const data = await fredFetch('series/search', {
    search_text: query,
    limit: opts.limit || 50,
    offset: opts.offset || 0,
    order_by: opts.order_by || 'search_rank',
  }, signal);
  return { series: extractSeries(data), count: data.count || 0 };
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
  return extractSeries(data);
}

// Anthropic API key management — wrapped in try-catch for Safari private browsing / quota exceeded
export function getAnthropicKey() {
  try {
    return localStorage.getItem('anthropic_api_key') || '';
  } catch {
    console.warn('Could not read anthropic_api_key from localStorage');
    return '';
  }
}

export function setAnthropicKey(key) {
  try {
    localStorage.setItem('anthropic_api_key', key.trim());
  } catch {
    console.warn('Could not save anthropic_api_key to localStorage');
  }
}

export function hasAnthropicKey() {
  try {
    return !!localStorage.getItem('anthropic_api_key');
  } catch {
    console.warn('Could not check anthropic_api_key in localStorage');
    return false;
  }
}

export function clearAnthropicKey() {
  try {
    localStorage.removeItem('anthropic_api_key');
  } catch {
    console.warn('Could not remove anthropic_api_key from localStorage');
  }
}
