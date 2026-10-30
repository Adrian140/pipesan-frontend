// FILE: src/components/Header.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Truck, ShieldCheck, FileText } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CartIcon from './layout/CartIcon';
import LogoComponent from './LogoComponent';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../translations'; // barrel export
import { useLanguage } from '../contexts/LanguageContext';

// Bandă utilitară de sus (texte scurte, per limbă)
const TOPBAR = {
  fr: ['Livraison rapide dans toute l’UE', 'Laiton CW617N certifié CE', 'Prix HT pour professionnels'],
  en: ['Fast delivery across the EU', 'CE certified CW617N brass', 'Trade prices excl. VAT'],
  it: ['Consegna rapida in tutta l’UE', 'Ottone CW617N certificato CE', 'Prezzi IVA esclusa per professionisti'],
  de: ['Schnelle Lieferung in die ganze EU', 'CE-zertifiziertes CW617N-Messing', 'Netto-Preise für Profis'],
  es: ['Envío rápido a toda la UE', 'Latón CW617N con certificación CE', 'Precios sin IVA para profesionales'],
  ro: ['Livrare rapidă în toată UE', 'Alamă CW617N certificată CE', 'Prețuri fără TVA pentru firme'],
};

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, sessionChecked, loading } = useAuth();

  // namespace "nav"
  const { t } = useTranslation('nav');
  const { currentLanguage } = useLanguage();
  const topbar = TOPBAR[currentLanguage] || TOPBAR.fr;

  // chei stabile + etichete traduse
  const navigation = [
    { id: 'home',     label: t('home')     || 'Home',     href: '/' },
    { id: 'products', label: t('products') || 'Products', href: '/products' },
    { id: 'contact',  label: t('contact')  || 'Contact',  href: '/contact' },
    { id: 'support',  label: t('support')  || 'Support',  href: '/support' },
  ];

  const isActive = (href) => location.pathname === href;

  const renderAuthButtons = () => {
    if (loading && !sessionChecked) {
      return (
        <div className="animate-pulse flex space-x-3">
          <div className="h-10 w-20 bg-gray-100 rounded-lg" />
          <div className="h-10 w-24 bg-gray-100 rounded-lg" />
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex items-center space-x-2">
          <CartIcon />
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="px-3 py-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors rounded-lg hover:bg-brass-pale"
            >
              {t('admin')}
            </Link>
          )}
          <Link
            to="/dashboard"
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-paper"
          >
            {t('dashboard')}
          </Link>
          <button
            onClick={logout}
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
          >
            {t('logout')}
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <CartIcon />
        <Link
          to="/login"
          className="px-4 py-2 text-sm font-semibold text-text-primary border border-gray-300 hover:border-graphite-900 transition-colors rounded-lg"
        >
          {t('login')}
        </Link>
        <Link
          to="/register"
          className="bg-graphite-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-graphite-700 transition-colors"
        >
          {t('register')}
        </Link>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top utility bar */}
      <div className="bg-graphite-900 text-gray-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-center md:justify-between gap-6">
          <span className="flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-brass-light" />
            {topbar[0]}
          </span>
          <span className="hidden md:flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brass-light" />
            {topbar[1]}
          </span>
          <span className="hidden md:flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-brass-light" />
            {topbar[2]}
          </span>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <LogoComponent className="w-16 h-16" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`relative px-4 py-2 text-sm font-semibold transition-colors after:absolute after:left-4 after:right-4 after:-bottom-[19px] after:h-0.5 after:transition-colors ${
                  isActive(item.href)
                    ? 'text-text-primary after:bg-brass'
                    : 'text-text-secondary hover:text-text-primary after:bg-transparent'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <LanguageSwitcher />
            {renderAuthButtons()}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <CartIcon />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-text-primary hover:bg-paper rounded-lg transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-4 pt-4 pb-6 space-y-3 bg-white border-t border-gray-100">
              <div className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    className={`block px-4 py-3 text-base font-semibold rounded-lg transition-colors border-l-2 ${
                      isActive(item.href)
                        ? 'text-text-primary bg-paper border-brass'
                        : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-paper'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Language Switcher */}
              <div className="pt-4 border-t border-gray-100">
                <div className="px-4 pb-3">
                  <LanguageSwitcher />
                </div>
              </div>

              {/* User Actions */}
              <div className="space-y-3">
                {loading && !sessionChecked ? (
                  <div className="animate-pulse space-y-2 px-4">
                    <div className="h-12 bg-gray-100 rounded-lg" />
                    <div className="h-12 bg-gray-100 rounded-lg" />
                  </div>
                ) : user ? (
                  <div className="space-y-2">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block w-full text-center bg-brass-pale text-primary-dark px-4 py-3 rounded-lg font-semibold hover:bg-brass-light/30 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('admin')}
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="block w-full text-center bg-paper text-text-primary px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('dashboard')}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-center bg-red-50 text-red-600 px-4 py-3 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      {t('logout')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="block w-full text-center bg-paper text-text-primary px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('login')}
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full text-center bg-graphite-900 text-white px-4 py-3 rounded-lg font-semibold hover:bg-graphite-700 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}

export default Header;
