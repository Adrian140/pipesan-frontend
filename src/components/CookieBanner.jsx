import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { readConsent, saveConsent, OPEN_CONSENT_EVENT } from '../consent/consent';

const T = {
  fr: {
    title: 'Vos choix en matière de cookies',
    body: 'Nous utilisons des cookies nécessaires au fonctionnement du site (panier, connexion). Avec votre accord, nous mesurons aussi l’audience de façon anonyme pour améliorer la boutique. Aucune publicité, aucun partage avec des tiers.',
    accept: 'Tout accepter', reject: 'Tout refuser', customize: 'Personnaliser', save: 'Enregistrer mes choix',
    necessary: 'Nécessaires', necessaryDesc: 'Panier, connexion et mémorisation de votre choix. Toujours actifs.',
    analytics: 'Mesure d’audience', analyticsDesc: 'Pages vues et parcours d’achat, stockés chez PipeSan (UE), conservés 13 mois maximum.',
    always: 'Toujours actif', more: 'Politique de confidentialité',
  },
  en: {
    title: 'Your cookie choices',
    body: 'We use cookies that the site needs to work (cart, sign-in). With your consent we also measure visits anonymously to improve the shop. No advertising, no sharing with third parties.',
    accept: 'Accept all', reject: 'Reject all', customize: 'Customise', save: 'Save my choices',
    necessary: 'Necessary', necessaryDesc: 'Cart, sign-in and remembering this choice. Always on.',
    analytics: 'Audience measurement', analyticsDesc: 'Page views and shopping journey, stored by PipeSan (EU), kept for up to 13 months.',
    always: 'Always on', more: 'Privacy policy',
  },
  it: {
    title: 'Le tue scelte sui cookie',
    body: 'Usiamo cookie necessari al funzionamento del sito (carrello, accesso). Con il tuo consenso misuriamo anche le visite in modo anonimo per migliorare il negozio. Nessuna pubblicità, nessuna condivisione con terzi.',
    accept: 'Accetta tutto', reject: 'Rifiuta tutto', customize: 'Personalizza', save: 'Salva le mie scelte',
    necessary: 'Necessari', necessaryDesc: 'Carrello, accesso e memorizzazione di questa scelta. Sempre attivi.',
    analytics: 'Misurazione del pubblico', analyticsDesc: 'Pagine viste e percorso d’acquisto, salvati da PipeSan (UE), conservati al massimo 13 mesi.',
    always: 'Sempre attivo', more: 'Informativa privacy',
  },
  de: {
    title: 'Ihre Cookie-Einstellungen',
    body: 'Wir verwenden Cookies, die für die Website nötig sind (Warenkorb, Anmeldung). Mit Ihrer Zustimmung messen wir zusätzlich anonym die Besuche, um den Shop zu verbessern. Keine Werbung, keine Weitergabe an Dritte.',
    accept: 'Alle akzeptieren', reject: 'Alle ablehnen', customize: 'Anpassen', save: 'Auswahl speichern',
    necessary: 'Notwendig', necessaryDesc: 'Warenkorb, Anmeldung und Speicherung dieser Auswahl. Immer aktiv.',
    analytics: 'Reichweitenmessung', analyticsDesc: 'Seitenaufrufe und Kaufverlauf, gespeichert bei PipeSan (EU), höchstens 13 Monate.',
    always: 'Immer aktiv', more: 'Datenschutzerklärung',
  },
  es: {
    title: 'Tus preferencias de cookies',
    body: 'Usamos cookies necesarias para el funcionamiento del sitio (carrito, sesión). Con tu consentimiento también medimos las visitas de forma anónima para mejorar la tienda. Sin publicidad ni cesión a terceros.',
    accept: 'Aceptar todo', reject: 'Rechazar todo', customize: 'Personalizar', save: 'Guardar mis preferencias',
    necessary: 'Necesarias', necessaryDesc: 'Carrito, sesión y recordar esta elección. Siempre activas.',
    analytics: 'Medición de audiencia', analyticsDesc: 'Páginas vistas y recorrido de compra, guardados por PipeSan (UE), conservados 13 meses como máximo.',
    always: 'Siempre activo', more: 'Política de privacidad',
  },
  ro: {
    title: 'Alegerile tale privind cookie-urile',
    body: 'Folosim cookie-uri necesare pentru funcționarea site-ului (coș, autentificare). Cu acordul tău, măsurăm și vizitele, anonim, ca să îmbunătățim magazinul. Fără publicitate, fără partajare cu terți.',
    accept: 'Accept toate', reject: 'Refuz toate', customize: 'Personalizează', save: 'Salvează alegerile',
    necessary: 'Necesare', necessaryDesc: 'Coș, autentificare și memorarea acestei alegeri. Mereu active.',
    analytics: 'Măsurarea audienței', analyticsDesc: 'Pagini vizitate și parcursul de cumpărare, stocate de PipeSan (UE), păstrate cel mult 13 luni.',
    always: 'Mereu activ', more: 'Politica de confidențialitate',
  },
};

function CookieBanner() {
  const { currentLanguage } = useLanguage();
  const t = T[currentLanguage] || T.fr;
  const [isVisible, setIsVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    if (!readConsent()) setIsVisible(true);
    const open = () => {
      setAnalytics(readConsent()?.analytics === true);
      setDetails(true);
      setIsVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const choose = (value) => {
    saveConsent({ analytics: value }, currentLanguage);
    setIsVisible(false);
    setDetails(false);
  };

  if (!isVisible) return null;

  // „Refuz” are aceeași greutate vizuală ca „Accept” (cerință CNIL / EDPB).
  const btn = 'px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors';
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-lift p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-lg bg-graphite-900 items-center justify-center">
            <Cookie className="w-5 h-5 text-brass-light" />
          </div>
          <div className="flex-1">
            <h2 id="cookie-title" className="font-bold text-text-primary mb-1">{t.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t.body}{' '}
              <Link to="/privacy-policy" className="underline text-text-primary hover:text-primary">{t.more}</Link>
            </p>
          </div>
        </div>

        {details && (
          <div className="mt-4 divide-y divide-gray-100 border border-gray-200 rounded-xl">
            <div className="flex items-start justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-semibold text-text-primary">{t.necessary}</p>
                <p className="text-xs text-text-secondary mt-0.5">{t.necessaryDesc}</p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-light whitespace-nowrap pt-1">{t.always}</span>
            </div>
            <label className="flex items-start justify-between gap-4 p-4 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-text-primary">{t.analytics}</p>
                <p className="text-xs text-text-secondary mt-0.5">{t.analyticsDesc}</p>
              </div>
              <input
                type="checkbox"
                role="switch"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1 w-5 h-5 accent-primary shrink-0"
              />
            </label>
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center gap-2 sm:justify-end">
          {details ? (
            <button onClick={() => choose(analytics)} className={`${btn} border border-gray-300 text-text-primary hover:border-graphite-900`}>
              {t.save}
            </button>
          ) : (
            <button onClick={() => setDetails(true)} className={`${btn} text-text-secondary hover:text-text-primary underline-offset-2 hover:underline`}>
              {t.customize}
            </button>
          )}
          <button onClick={() => choose(false)} className={`${btn} bg-graphite-900 text-white hover:bg-graphite-700`}>
            {t.reject}
          </button>
          <button onClick={() => choose(true)} className={`${btn} bg-graphite-900 text-white hover:bg-graphite-700`}>
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
