import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { LEGAL_LOCALE, LEGAL_UPDATED } from '../../legal/company';

const UPDATED_LABEL = { fr: 'Dernière mise à jour', en: 'Last updated', it: 'Ultimo aggiornamento', de: 'Zuletzt aktualisiert', es: 'Última actualización', ro: 'Ultima actualizare' };

// A section is { h, p?: string[], list?: string[], box?: string[], links?: [path, label][] }.
// `box` renders a framed block, used for texts the law asks to show as they are (model forms, guarantee notices).
export function useLegalText(T) {
  const { currentLanguage } = useLanguage();
  const lang = T[currentLanguage] ? currentLanguage : 'fr';
  return { lang, t: T[lang] };
}

function LegalPage({ T, icon: Icon, children }) {
  const { lang, t } = useLegalText(T);

  return (
    <div className="min-h-screen bg-paper py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          {Icon && <Icon className="w-12 h-12 text-primary mx-auto mb-4" />}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-3">{t.title}</h1>
          <p className="text-text-secondary">
            {UPDATED_LABEL[lang]}: {new Date(LEGAL_UPDATED).toLocaleDateString(LEGAL_LOCALE[lang])}
          </p>
          {t.intro && <p className="text-text-secondary mt-4 max-w-2xl mx-auto">{t.intro}</p>}
        </div>

        {children}

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 space-y-8">
          {t.sections.map((s) => (
            <section key={s.h} id={s.id}>
              <h2 className="text-xl font-bold text-text-primary mb-3">{s.h}</h2>
              {s.p?.map((p) => (
                <p key={p} className="text-text-secondary leading-relaxed mb-2 last:mb-0">{p}</p>
              ))}
              {s.list && (
                <ul className="list-disc pl-5 text-text-secondary space-y-1 mt-2">
                  {s.list.map((li) => <li key={li}>{li}</li>)}
                </ul>
              )}
              {s.box && (
                <div className="mt-3 rounded-xl border border-gray-300 bg-paper p-5 font-mono text-sm text-text-primary space-y-2 whitespace-pre-line">
                  {s.box.map((line) => <p key={line}>{line}</p>)}
                </div>
              )}
              {s.links && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                  {s.links.map(([to, label]) => (
                    <Link key={to} to={to} className="text-primary hover:text-primary-dark underline">{label}</Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LegalPage;
