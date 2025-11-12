import React, { useState } from 'react';
import { Shield, Key, Smartphone, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDashboardTranslation } from '../../hooks/useDashboardTranslation';
import { apiClient } from '../../config/api';

function SecuritySettings() {
  const { user, enable2FA, verify2FA, disable2FA } = useAuth();
  const { dt } = useDashboardTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage(dt('passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage(dt('passwordMinLength'));
      setLoading(false);
      return;
    }

    try {
      await apiClient.auth.changePassword(currentPassword, newPassword);
      setMessage(dt('passwordChangedSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
   } catch (error) {
       setMessage(error.message || 'Eroare la schimbarea parolei');
   }

    setLoading(false);
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setMessage('');

    const result = await enable2FA();
    
    if (result.success) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setShow2FASetup(true);
    } else {
      setMessage(result.error);
    }
    
    setLoading(false);
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    setMessage('');

    const result = await verify2FA(verificationCode);
    
    if (result.success) {
      setMessage(dt('twoFactorEnabledSuccess'));
      setIs2FAEnabled(true);
      setShow2FASetup(false);
      setVerificationCode('');
    } else {
      setMessage(result.error);
    }
    
    setLoading(false);
  };

  const handleDisable2FA = async () => {
    if (!confirm('Ești sigur că vrei să dezactivezi autentificarea cu doi factori?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await disable2FA(verificationCode);
    
    if (result.success) {
      setMessage(dt('twoFactorDisabled'));
      setIs2FAEnabled(false);
      setVerificationCode('');
    } else {
      setMessage(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-6">{dt('security')}</h2>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg ${
          message.includes('succes') 
            ? 'bg-green-50 border border-green-200 text-green-600'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message}
        </div>
      )}

      {/* Password Change */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <Key className="w-6 h-6 text-primary mr-3" />
          <h3 className="text-lg font-semibold text-text-primary">{dt('changePassword')}</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-text-primary mb-2">
              {dt('currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-light hover:text-text-secondary"
              >
                {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
              {dt('newPassword')}
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
              {dt('confirmNewPassword')}
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? dt('changing') : dt('changePassword')}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Smartphone className="w-6 h-6 text-primary mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">{dt('twoFactorAuth')}</h3>
              <p className="text-sm text-text-secondary">
                {dt('addExtraLayer')}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <span className={`px-3 py-1 text-sm rounded-full ${
              is2FAEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {is2FAEnabled ? dt('enabled') : dt('disabled')}
            </span>
          </div>
        </div>

        {!is2FAEnabled && !show2FASetup && (
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    Activarea 2FA va proteja contul tău chiar dacă cineva îți află parola. 
                    Vei avea nevoie de o aplicație de autentificare precum Google Authenticator sau Authy.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleEnable2FA}
              disabled={loading}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? dt('configuring') : dt('enable2FA')}
            </button>
          </div>
        )}

        {show2FASetup && (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800">
                    {dt('scanQRCode')}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 inline-block mb-4">
                {qrCode ? (
                  <img src={qrCode} alt="QR Code pentru 2FA" className="w-48 h-48" />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500">Se încarcă QR Code...</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-text-secondary mb-4">
                {dt('enterManually')} <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
              </p>
            </div>

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-text-primary mb-2">
                {dt('verificationCode')}
              </label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg font-mono"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShow2FASetup(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-text-secondary rounded-lg hover:bg-gray-50 transition-colors"
              >
                {dt('cancel')}
              </button>
              <button
                onClick={handleVerify2FA}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? dt('verifying') : dt('verifyAndEnable')}
              </button>
            </div>
          </div>
        )}

        {is2FAEnabled && (
          <div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800">
                    {dt('twoFactorActive')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="disable2FACode" className="block text-sm font-medium text-text-primary mb-2">
                  {dt('disableInstructions')}
                </label>
                <input
                  type="text"
                  id="disable2FACode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-lg font-mono"
                />
              </div>

              <button
                onClick={handleDisable2FA}
                disabled={loading || verificationCode.length !== 6}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? dt('disabling') : dt('disable2FA')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">{dt('securityTips')}</h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {dt('securityTip1')}
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {dt('securityTip2')}
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {dt('securityTip3')}
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            {dt('securityTip4')}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default SecuritySettings;
