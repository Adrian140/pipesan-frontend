import { it, expect, vi, beforeEach } from 'vitest';

const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
vi.mock('../src/config/supabase', () => ({ supabase: { rpc } }));

const { saveConsent, readConsent, hasAnalyticsConsent, CONSENT_VERSION } = await import('../src/consent/consent');
const { analyticsApi, trafficSource } = await import('../src/config/api/analytics');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = 'ps_vid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  rpc.mockClear();
});

it('records nothing before the visitor chooses', async () => {
  await analyticsApi.pageview('/products');
  await analyticsApi.track('add_to_cart', {});
  expect(rpc).not.toHaveBeenCalled();
  expect(document.cookie).not.toContain('ps_vid=');
});

it('tracks page views only after analytics consent and logs the choice', async () => {
  saveConsent({ analytics: true }, 'fr');
  expect(rpc).toHaveBeenCalledWith('pipesan_record_consent', expect.objectContaining({ p_analytics: true, p_version: CONSENT_VERSION, p_language: 'fr' }));
  await analyticsApi.pageview('/products');
  const call = rpc.mock.calls.find(([name]) => name === 'pipesan_track_pageview');
  expect(call[1]).toMatchObject({ p_path: '/products' });
  expect(call[1].p_visitor).toMatch(/^[0-9a-f-]{36}$/);
  expect(document.cookie).toContain('ps_vid=');
});

it('rejecting removes identifiers and stops tracking', async () => {
  saveConsent({ analytics: true }, 'fr');
  await analyticsApi.pageview('/');
  saveConsent({ analytics: false }, 'fr');
  expect(hasAnalyticsConsent()).toBe(false);
  expect(document.cookie).not.toContain('ps_vid=');
  rpc.mockClear();
  await analyticsApi.track('add_to_cart', {});
  expect(rpc).not.toHaveBeenCalled();
});

it('asks again once the stored consent is older than six months', () => {
  localStorage.setItem('ps_consent', JSON.stringify({ version: CONSENT_VERSION, analytics: true, id: 'x', ts: new Date(Date.now() - 200 * 864e5).toISOString() }));
  expect(readConsent()).toBeNull();
});

it('derives the source from UTM or an external referrer', () => {
  expect(trafficSource('?utm_source=newsletter&utm_medium=email', '')).toEqual({ source: 'newsletter', medium: 'email' });
  expect(trafficSource('', 'https://www.google.com/search?q=x')).toEqual({ source: 'www.google.com', medium: 'referral' });
  expect(trafficSource('', '')).toEqual({ source: null, medium: null });
});
