import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { VATProvider } from './contexts/VATContext';
import OrderDetail from "./components/admin/tabs/OrderDetail";
// Layout
import Header from './components/Header';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';

// Pages
import Home from './pages/Home';
import Categories from './pages/Categories';
import TechnicalSpecs from './pages/TechnicalSpecs';
import Products from './pages/Products';
import Services from './pages/Services';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess';
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

// Dashboard / Admin
import Dashboard from './components/dashboard/Dashboard';
import AdminPanel from './components/admin/AdminPanel';
import RequireAdmin from './components/admin/RequireAdmin';

// Legal
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';

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

function AppContent() {
  return (
    <>
      <Header />
      <SafeShoppingCart />
      <main>
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/admin/orders/:id" element={<RequireAdmin><OrderDetail /></RequireAdmin>} />
        </Routes>
      </main>
      <Footer />
      <CookieBanner />
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
              <CartProvider>
                <div className="min-h-screen bg-white">
                  <AppContent />
                </div>
              </CartProvider>
            </VATProvider>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
