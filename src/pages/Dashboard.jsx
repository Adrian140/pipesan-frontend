// ex: src/pages/Dashboard.jsx
import { useTranslation } from '../translations/i18n';

export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  return (
    <>
      <h1>{t('dashboard')}</h1>
      <p>{t('manageAccount')}</p>
      {/* tab titles */}
      <ul>
        <li>{t('personalData')}</li>
        <li>{t('myOrders')}</li>
        <li>{t('addresses')}</li>
        <li>{t('billingData')}</li>
        <li>{t('myInvoices')}</li>
        <li>{t('security')}</li>
      </ul>
    </>
  );
}
