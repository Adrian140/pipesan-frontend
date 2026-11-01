import { supabase } from '../supabase';
import { getVisitorId, getSessionId } from '../../utils/visitor';

function deviceType() {
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Sursa: utm_source, altfel domeniul de referință extern (fără căi/parametri).
export function trafficSource(search = window.location.search, referrer = document.referrer) {
  const params = new URLSearchParams(search);
  let source = params.get('utm_source');
  if (!source && referrer) {
    try {
      const host = new URL(referrer).hostname;
      if (host && host !== window.location.hostname) source = host;
    } catch { /* referrer invalid */ }
  }
  return { source: source || null, medium: params.get('utm_medium') || (source ? 'referral' : null) };
}

// Totul e best-effort: analytics nu are voie să strice navigarea sau coșul.
export const analyticsApi = {
  async pageview(path = window.location.pathname + window.location.search) {
    const visitor = getVisitorId();
    const session = getSessionId();
    if (!visitor || !session) return;
    const { source, medium } = trafficSource();
    let referrer = null;
    try { referrer = document.referrer ? new URL(document.referrer).origin : null; } catch { /* referrer invalid */ }
    await supabase
      .rpc('pipesan_track_pageview', {
        p_visitor: visitor, p_session: session, p_path: path, p_referrer: referrer,
        p_source: source, p_medium: medium, p_device: deviceType(),
      })
      .then(() => {}, () => {});
  },

  async track(name, props = {}) {
    const visitor = getVisitorId();
    const session = getSessionId();
    if (!visitor || !session) return;
    await supabase
      .rpc('pipesan_track_event', { p_visitor: visitor, p_session: session, p_name: name, p_props: props })
      .then(() => {}, () => {});
  },
};
