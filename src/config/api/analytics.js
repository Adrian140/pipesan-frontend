import { supabase } from '../supabase';
import { getVisitorId, getSessionId } from '../../utils/visitor';

async function ensureVisitor(visitorId, meta = {}) {
  // best-effort: inserare "upsert light" (insert; dacă e duplicat, ignoră)
  await supabase.from('analytics_visitors').insert({
    id: visitorId,
    first_source: meta.source || null,
    first_medium: meta.medium || null,
    device: meta.device || null,
    country: meta.country || null,
  }).then(()=>{}).catch(()=>{});
}

async function ensureSession(sessionId, visitorId, landing) {
  await supabase.from('analytics_sessions').insert({
    id: sessionId, visitor_id: visitorId,
    landing_path: landing?.path || window.location.pathname,
    landing_utm_source: landing?.utm_source || null,
    landing_utm_medium: landing?.utm_medium || null,
    device: landing?.device || null,
    country: landing?.country || null
  }).then(()=>{}).catch(()=>{});
}

export const analyticsApi = {
  async pageview(extra = {}) {
    const visitor_id = getVisitorId();
    const session_id = getSessionId();

    // inițializează best-effort
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get('utm_source') || document.referrer ? new URL(document.referrer).hostname : null;
    const utm_medium = params.get('utm_medium') || null;

    await ensureVisitor(visitor_id, {
      source: utm_source, medium: utm_medium,
      device: navigator.userAgent,
    });
    await ensureSession(session_id, visitor_id, {
      path: window.location.pathname,
      utm_source, utm_medium,
      device: navigator.userAgent
    });

    // 1) pageviews
    await supabase.from('analytics_pageviews').insert({
      session_id, visitor_id,
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      duration_ms: null
    });

    // 2) event mirror (opțional util pt. funnel)
    await supabase.from('analytics_events').insert({
      session_id, visitor_id,
      name: 'page_view',
      props: extra || {}
    });
  },

  async track(name, props = {}) {
    const visitor_id = getVisitorId();
    const session_id = getSessionId();
    await supabase.from('analytics_events').insert({
      session_id, visitor_id,
      name, props
    });
  }
};
