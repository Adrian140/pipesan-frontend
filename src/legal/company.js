// Seller identity used by every legal page. Registry data: ANAF / Registrul Comerțului (checked 2026-11-01).
export const COMPANY = {
  name: 'FISH VALLEY S.R.L.',
  brand: 'PipeSan',
  form: 'S.R.L.',
  address: 'Sat Leamna de Jos, Com. Bucovăț, Nr. 159A, 207128, Jud. Dolj, România',
  regNo: 'J2018001428167',
  vat: 'RO39535603',
  email: 'contact@pipesan.eu',
  phone: '+33 675 11 62 18',
  site: 'www.pipesan.eu',
};

export const SELLER_LINE = `${COMPANY.name} · ${COMPANY.address} · Reg. Com. ${COMPANY.regNo} · VAT ${COMPANY.vat}`;
export const CONTACT_LINE = `${COMPANY.email} · ${COMPANY.phone}`;

// Bump when the text of a legal page changes.
export const LEGAL_UPDATED = '2026-11-01';

export const LEGAL_LOCALE = { fr: 'fr-FR', en: 'en-GB', it: 'it-IT', de: 'de-DE', es: 'es-ES', ro: 'ro-RO' };
