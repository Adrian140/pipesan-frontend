import React from 'react';
import { Building2 } from 'lucide-react';
import LegalPage from './LegalPage';
import { LEGAL_NOTICE_T } from '../../legal/legalNotice';

const LegalNotice = () => <LegalPage T={LEGAL_NOTICE_T} icon={Building2} />;

export default LegalNotice;
