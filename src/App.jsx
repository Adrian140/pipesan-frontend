import React from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import {SiteContentProvider} from './contexts/SiteContentContext';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './config/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { VATProvider } from './contexts/VATContext';
import { RouteSeo, NotFound } from './seo/RouteSeo';
// Layout
import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import AnalyticsTracker from './components/AnalyticsTracker';

// Pages
import Home from './pages/Home';
import Categories from './pages/Categories';
import TechnicalSpecs from './pages/TechnicalSpecs';
import Products from './pages/Products';
import Services from './pages/Services';
import Contact from './pages/Contact';
import Support from './pages/Support';
import About from './pages/About';
import Blog from './pages/Blog';
import B2BSolutions from './pages/B2BSolutions';
import ServicesPricing from './pages/ServicesPricing';

// Auth
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ForgotPasswordForm from './components/auth/ForgotPasswordForm';
import EmailVerificationSuccess from './components/auth/EmailVerificationSuccess';

// Account, checkout and admin load on demand so the public pages ship less JavaScript
import RequireAdmin from './components/admin/RequireAdmin';
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));
const OrderDetail = React.lazy(() => import('./components/admin/tabs/OrderDetail'));
const Checkout = React.lazy(() => import('./pages/Checkout.jsx'));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));

// Legal
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import LegalNotice from './components/legal/LegalNotice';
import ShippingPolicy from './components/legal/ShippingPolicy';
import ReturnsPolicy from './components/legal/ReturnsPolicy';
import Withdrawal from './components/legal/Withdrawal';

// Product detail
import ProductDetail from './pages/ProductDetail';

// Cart (fix: importăm static și folosim hook-ul la top-level)
import ShoppingCart from './components/cart/ShoppingCart';
import { useCart } from './contexts/CartContext';

// Componentă mică ce leagă contextul de UI-ul coșului (fără importuri dinamice, fără efecte)
function SafeShoppingCart() {
  const {
    isOpen,
    closeCart,
    items,
    updateQuantity,
    removeItem
  } = useCart();

  return (
    <ShoppingCart
      isOpen={isOpen}
      onClose={closeCart}
      items={items}
      onUpdateQuantity={updateQuantity}
      onRemoveItem={removeItem}
    />
  );
}

// Dacă Supabase ne trimite pe altă pagină cu sesiunea de recuperare, mergem la formularul de resetare
function PasswordRecoveryRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const hash = window.location.hash || '';
    if (location.pathname !== '/reset-password' && /type=recovery/.test(hash)) {
      navigate(`/reset-password${hash}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') {
        navigate('/reset-password', { replace: true });
      }
    });
    return () => data?.subscription?.unsubscribe();
  }, [navigate]);

  return null;
}

function AppContent() {
  const routeKey = useLocation().pathname;
  return (
    <>
      <PasswordRecoveryRedirect />
      <RouteSeo />
      <Header />
      <SafeShoppingCart />
      <main>
        {/* O pagină care cade nu mai strică tot site-ul; schimbarea paginii resetează eroarea. */}
        <ErrorBoundary key={routeKey}>
        <React.Suspense fallback={<div className="min-h-[60vh]" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/technical-specs" element={<TechnicalSpecs />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/services" element={<Services />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/support" element={<Support />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/b2b" element={<B2BSolutions />} />
          <Route path="/services-pricing" element={<ServicesPricing />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/email-verified" element={<EmailVerificationSuccess />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/legal-notice" element={<LegalNotice />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/returns" element={<ReturnsPolicy />} />
          <Route path="/withdrawal" element={<Withdrawal />} />
          <Route path="/admin/orders/:id" element={<RequireAdmin><OrderDetail /></RequireAdmin>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </React.Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <CookieBanner />
      <AnalyticsTracker />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <LanguageProvider>
            <VATProvider>
              <SiteContentProvider><CartProvider>
                <div className="min-h-screen bg-white">
                  <AppContent />
                </div>
              </CartProvider></SiteContentProvider>
            </VATProvider>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
