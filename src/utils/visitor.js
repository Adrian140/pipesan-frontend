import { hasAnalyticsConsent } from '../consent/consent';

const VID_KEY = 'ps_vid';
const SID_KEY = 'ps_sid';
const SID_TTL_MIN = 30;

const uuid = () =>
  crypto?.randomUUID?.() ||
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random()*16)|0, v = c==='x'?r:(r&0x3)|0x8; return v.toString(16);
  });

const set = (k, v, days=365) => {
  const d = new Date();
  d.setTime(d.getTime() + days*24*60*60*1000);
  document.cookie = `${k}=${v}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
};
const get = (k) => {
  return document.cookie.split('; ').find(x => x.startsWith(k+'='))?.split('=')[1];
};

// Identificatorii de vizitator/sesiune există doar cu consimțământ pentru analytics.
export function getVisitorId() {
  if (!hasAnalyticsConsent()) return null;
  let v = get(VID_KEY);
  if (!v) { v = uuid(); set(VID_KEY, v, 3650); }
  return v;
}

export function getSessionId() {
  if (!hasAnalyticsConsent()) return null;
  const now = Date.now();
  try {
    const raw = sessionStorage.getItem(SID_KEY);
    if (raw) {
      const { id, ts } = JSON.parse(raw);
      // sesiunea expiră după 30 de minute de inactivitate
      if (now - ts < SID_TTL_MIN*60*1000) {
        sessionStorage.setItem(SID_KEY, JSON.stringify({ id, ts: now }));
        return id;
      }
    }
  } catch {}
  const id = uuid();
  try { sessionStorage.setItem(SID_KEY, JSON.stringify({ id, ts: now })); } catch {}
  return id;
}
