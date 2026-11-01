import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsApi } from '../config/api/analytics';
import { CONSENT_EVENT } from '../consent/consent';

// O vizualizare la fiecare schimbare de pagină; fără consimțământ analyticsApi nu face nimic.
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return;
    analyticsApi.pageview(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Vizitatorul care tocmai a acceptat e numărat pe pagina pe care se află.
  useEffect(() => {
    const onConsent = (e) => {
      if (e.detail?.analytics && !window.location.pathname.startsWith('/admin')) {
        analyticsApi.pageview(window.location.pathname + window.location.search);
      }
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  return null;
}
