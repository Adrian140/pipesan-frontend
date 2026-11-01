import React from 'react';
import { Shield, Cookie } from 'lucide-react';
import LegalPage, { useLegalText } from './legal/LegalPage';
import { PRIVACY_T } from '../legal/privacy';
import { openConsentSettings } from '../consent/consent';

function CookieSettingsButton() {
  const { t } = useLegalText(PRIVACY_T);
  return (
    <div className="text-center mb-6">
      <button type="button" onClick={openConsentSettings} className="inline-flex items-center gap-2 border border-primary text-primary hover:bg-brass-pale rounded-lg px-5 py-2.5 font-semibold">
        <Cookie className="w-4 h-4" />{t.cookieButton}
      </button>
    </div>
  );
}

const PrivacyPolicy = () => (
  <LegalPage T={PRIVACY_T} icon={Shield}>
    <CookieSettingsButton />
  </LegalPage>
);

export default PrivacyPolicy;
