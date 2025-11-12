// FILE: src/components/Header.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import CartIcon from './layout/CartIcon';
import LogoComponent from './LogoComponent';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../translations'; // barrel export

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout, sessionChecked, loading } = useAuth();

  // namespace "nav"
  const { t } = useTranslation('nav');

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
          <div className="h-10 w-20 bg-gray-200 rounded-lg" />
          <div className="h-10 w-24 bg-gray-200 rounded-lg" />
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
              className="px-3 py-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors rounded-lg hover:bg-orange-50"
            >
              {t('admin')}
            </Link>
          )}
          <Link
            to="/dashboard"
            className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
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
          className="px-4 py-2 text-sm font-medium text-text-primary border border-gray-300 hover:border-primary hover:text-primary transition-colors rounded-lg hover:bg-gray-50"
        >
          {t('login')}
        </Link>
        <Link
          to="/register"
          className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {t('register')}
        </Link>
      </div>
    );
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/">
              <LogoComponent className="w-20 h-20" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-primary bg-blue-50 border border-blue-200'
                    : 'text-text-secondary hover:text-primary hover:bg-gray-50'
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
              className="p-2 text-text-secondary hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
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
                    className={`block px-4 py-3 text-base font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'text-primary bg-blue-50 border border-blue-200'
                        : 'text-text-secondary hover:text-primary hover:bg-gray-50'
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
                    <div className="h-12 bg-gray-200 rounded-lg" />
                    <div className="h-12 bg-gray-200 rounded-lg" />
                  </div>
                ) : user ? (
                  <div className="space-y-2">
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block w-full text-center bg-orange-50 text-accent px-4 py-3 rounded-lg font-medium hover:bg-orange-100 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('admin')}
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      className="block w-full text-center bg-gray-100 text-text-primary px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
                      className="block w-full text-center bg-gray-100 text-text-primary px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {t('login')}
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full text-center bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
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
    </header>
  );
}

export default Header;
