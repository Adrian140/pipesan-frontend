import React, { useEffect } from 'react';
import { CheckCircle, Home, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function EmailVerificationSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');

  useEffect(() => {
    // If we have tokens in URL, process the verification
    if (accessToken && refreshToken) {
      handleEmailVerification();
    }
  }, [accessToken, refreshToken]);

  const handleEmailVerification = async () => {
    try {
      // Update user verification status
      if (refreshUser) {
        await refreshUser();
      }
      
      console.log('✅ Email verification successful');
      
      // Auto-redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
      
    } catch (error) {
      console.error('Error processing email verification:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Email verificat cu succes!
          </h2>
          
          <p className="text-lg text-text-secondary mb-8">
            Contul tău a fost activat cu succes. Acum poți accesa toate funcționalitățile platformei.
          </p>

          {/* User Welcome */}
          {user && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Bun venit, {user.firstName || user.first_name || 'Utilizator'}!
                </span>
              </div>
            </div>
          )}

          {/* Navigation Options */}
          <div className="space-y-4">
            <Link
              to="/"
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Mergi la pagina principală
            </Link>
            
            <Link
              to="/dashboard"
              className="w-full flex items-center justify-center px-6 py-3 border border-primary text-base font-medium rounded-lg text-primary bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Accesează Dashboard-ul
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            
            <Link
              to="/products"
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-text-secondary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Explorează produsele
            </Link>
          </div>

          {/* Auto-redirect notice */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-blue-800">
                Vei fi redirecționat automat către pagina principală în câteva secunde...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationSuccess;
