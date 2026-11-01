import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import LegalPage, { useLegalText } from './LegalPage';
import { RETURNS_T } from '../../legal/returns';

function WithdrawButton() {
  const { t } = useLegalText(RETURNS_T);
  return (
    <div className="text-center mb-6">
      <Link to="/withdrawal" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-lg px-6 py-3 font-semibold">
        <RotateCcw className="w-4 h-4" />{t.cta}
      </Link>
    </div>
  );
}

const ReturnsPolicy = () => (
  <LegalPage T={RETURNS_T} icon={RotateCcw}>
    <WithdrawButton />
  </LegalPage>
);

export default ReturnsPolicy;
