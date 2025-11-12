import React, { useState } from 'react';
import { User, CreditCard, FileText, Shield, MapPin, LogOut, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDashboardTranslation } from '../../hooks/useDashboardTranslation';
import PersonalProfile from './PersonalProfile';
import BillingProfiles from './BillingProfiles';
import InvoicesList from './InvoicesList';
import SecuritySettings from './SecuritySettings';
import AddressBook from './AddressBook';
import MyOrders from './MyOrders';
import EmailVerificationPrompt from '../auth/EmailVerificationPrompt';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout, loading, sessionChecked } = useAuth();
  const { dt } = useDashboardTranslation();
  const navigate = useNavigate();

  // Show loading only briefly during initial session check
  if (loading && !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-text-secondary">{dt('loading')}</div>
        </div>
      </div>
    );
  }

  // If no user after session check, redirect to login
  if (!user && sessionChecked) {
    console.log('No user found in dashboard, redirecting to login...');
    navigate('/login');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <div className="text-text-secondary">Redirecting...</div>
        </div>
      </div>
    );
  }
  
  const tabs = [
    { id: 'profile', label: dt('personalData'), icon: User },
    { id: 'orders', label: dt('myOrders'), icon: Package },
    { id: 'addresses', label: dt('addresses'), icon: MapPin },
    { id: 'billing', label: dt('billingData'), icon: CreditCard },
    { id: 'invoices', label: dt('myInvoices'), icon: FileText },
    { id: 'security', label: dt('security'), icon: Shield }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <PersonalProfile />;
      case 'orders':
        return <MyOrders />;
      case 'addresses':
        return <AddressBook />;
      case 'billing':
        return <BillingProfiles />;
      case 'invoices':
        return <InvoicesList />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <PersonalProfile />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {dt('hello')}, {user?.firstName || user?.first_name || 'User'}!
              </h1>
              <p className="text-text-secondary">
                {dt('manageAccount')}
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center px-4 py-2 text-text-secondary hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {dt('logout')}
            </button>
          </div>
        </div>

        {/* Email Verification Prompt */}
        <EmailVerificationPrompt user={user} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
