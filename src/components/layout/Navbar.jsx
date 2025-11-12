// ex: src/components/layout/Navbar.jsx
import { useTranslation } from '../../translations/i18n';

function Navbar() {
  const { t } = useTranslation('nav');
  return (
    <nav>
      <a href="/">{t('home')}</a>
      <a href="/products">{t('products')}</a>
      <a href="/contact">{t('contact')}</a>
      <a href="/support">{t('support')}</a>
    </nav>
  );
}
