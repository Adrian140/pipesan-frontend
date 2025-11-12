import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Package, FileText, Users, Truck, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../config/api';
import ProductsTab from './tabs/ProductsTab';
import SettingsTab from './tabs/SettingsTab';
import WeightBasedShippingTab from './tabs/WeightBasedShippingTab';
import UsersTab from './tabs/UsersTab';
import ReviewsTab from './tabs/ReviewsTab';
import { useNavigate, useLocation } from 'react-router-dom';
import OrdersTab from './tabs/OrdersTab';
import { BarChart3 } from 'lucide-react';
import AnalyticsTab from './tabs/AnalyticsTab';

function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  // Persist last active tab
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'products';
  });
  
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  const safeProducts = products || [];
  const safeUsers = users || [];

  const { user, logout, loading, sessionChecked } = useAuth();
  
  // Check admin status more reliably
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const adminEmails = ['contact@pipesan.eu', 'ioan.adrian.bucur@gmail.com'];
    console.log('🔍 Checking admin status for user:', {
      email: user.email,
      role: user.role,
      isAdminEmail: adminEmails.includes(user.email?.toLowerCase()),
      isAdminRole: user.role === 'admin'
    });
    return user.role === 'admin' || adminEmails.includes(user.email?.toLowerCase());
  }, [user]);
  
  // Show loading only briefly during initial session check
  if (loading && !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-text-secondary">Verificare sesiune...</div>
        </div>
      </div>
    );
  }

  // If session is checked but no user, redirect to login
  if (!user) {
    console.log('❌ No user found in AdminPanel, redirecting to login...');
    const currentPath = location.pathname + location.search;
    navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-text-secondary">Redirecționare...</div>
        </div>
      </div>
    );
  }

  // If user exists but is not admin, redirect to dashboard
  if (!isAdmin) {
    console.log('🚫 User is not admin, redirecting to dashboard. User:', {
      email: user.email,
      role: user.role,
      isAdmin
    });
    navigate('/dashboard');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-text-secondary">Redirecționare...</div>
        </div>
      </div>
    );
  }

  console.log('✅ Admin access confirmed for:', user.email, 'with role:', user.role);
  
  const tabs = [
    { id: 'products', label: 'Produse', icon: Package },
    { id: 'shipping', label: 'Tarife Livrare', icon: Truck },
    { id: 'reviews', label: 'Recenzii', icon: MessageSquare },
    { id: 'users', label: 'Utilizatori', icon: Users },
    { id: 'orders', label: 'Comenzi', icon: FileText }, // importă FileText din lucide-react
    { id: 'settings', label: 'Setări', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  // Fetch data when tab changes or component mounts
  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchData();
  }, [activeTab, user, isAdmin]);
  
  const fetchData = async () => {
    setPageLoading(true);
    setMessage('');
    try {
      switch (activeTab) {
        case 'products': {
          const productsData = await apiClient.admin.getProducts();
          setProducts(productsData || []);
          break;
        }
        case 'users': {
          // UsersTab își ia singur datele
          break;
        }
        case 'reviews':
          // ReviewsTab își ia singur datele
          break;
        case 'shipping':
          // ShippingTab își ia singur datele
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Eroare la încărcarea datelor');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSave = async (item, type) => {
    setActionLoading(true);
    setMessage('');
    try {
      let result = null;
      if (type === 'products') {
        if (item && item.id) {
          result = await apiClient.admin.updateProduct(item.id, item);
        } else {
          result = await apiClient.admin.createProduct(item);
        }
      }
      setMessage('Salvat cu succes!');
      await fetchData();
      return result;
    } catch (error) {
      console.error(error);
      setMessage(error?.message || 'Eroare la salvare');
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    // 🔒 Nu mai folosim window.confirm – poate fi blocat
    setActionLoading(true);
    try {
      if (type === 'products') {
        await apiClient.admin.deleteProduct(id);
      }
      setMessage('Șters cu succes!');
      await fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      setMessage(error?.message || 'Eroare la ștergere');
    } finally {
      setActionLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <ProductsTab
            products={safeProducts}
            handleSave={handleSave}
            handleDelete={handleDelete}
            pageLoading={pageLoading}
            actionLoading={actionLoading}
            message={message}
          />
        );
      case 'shipping':
        return <WeightBasedShippingTab />;
      case 'reviews':
        return <ReviewsTab />;
      case 'users':
        return <UsersTab />;
      case 'orders':
        return <OrdersTab />;
      case 'settings':
        return <SettingsTab />;
      case 'analytics':
        return <AnalyticsTab />;
        default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Admin Panel</h1>
              <p className="text-text-secondary">
                Gestionează produsele, tarifele de livrare și setările site-ului
              </p>
            </div>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout Admin
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto space-x-4 pb-4 border-b border-gray-200 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setMessage('');
              }}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-gray-100'
              }`}
            >
              {React.createElement(tab.icon, { className: 'w-5 h-5 mr-2' })}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {message && (
            <div
              className={`p-4 rounded-lg mb-4 text-center ${
                message.includes('succes') || message.includes('success')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {message}
            </div>
          )}
          <div>{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
