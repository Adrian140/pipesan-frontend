import { supabase } from '../config/supabase';

// Versiunea textului din banner; o schimbare cere din nou consimțământul.
export const CONSENT_VERSION = '2026-11-01';
// CNIL recomandă re-întrebarea după cel mult 6 luni.
const MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const KEY = 'ps_consent';
export const CONSENT_EVENT = 'pipesan:consent';
export const OPEN_CONSENT_EVENT = 'pipesan:open-consent';

const uuid = () =>
  crypto?.randomUUID?.() ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

export function readConsent() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.version === CONSENT_VERSION && Date.now() - Date.parse(c.ts) < MAX_AGE_MS) return c;
  } catch { /* consimțământ ilizibil = lipsă */ }
  return null;
}

export const hasAnalyticsConsent = () => readConsent()?.analytics === true;

export function saveConsent({ analytics }, language) {
  const previous = readConsent();
  const consent = { version: CONSENT_VERSION, analytics: !!analytics, ts: new Date().toISOString(), id: previous?.id || uuid() };
  try {
    localStorage.setItem(KEY, JSON.stringify(consent));
    localStorage.removeItem('cookieConsent'); // bannerul vechi, fără categorii
  } catch { /* fără storage, alegerea ține doar pe pagina curentă */ }
  if (!consent.analytics) clearAnalyticsIds();
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  supabase
    .rpc('pipesan_record_consent', { p_consent: consent.id, p_analytics: consent.analytics, p_version: CONSENT_VERSION, p_language: language || null })
    .then(() => {}, () => {});
  return consent;
}

export const openConsentSettings = () => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));

export function clearAnalyticsIds() {
  document.cookie = 'ps_vid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
  try { sessionStorage.removeItem('ps_sid'); } catch { /* nimic de șters */ }
}
