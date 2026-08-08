import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import { 
  Shield, Download, Trash2, Mail, ShieldAlert, CheckCircle, 
  HelpCircle, ExternalLink, Cookie 
} from 'lucide-react';

const Settings = () => {
  const { user, verifyEmail, logout, deleteAccount } = useAuth();
  
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState(false);
  const [verifyingDelete, setVerifyingDelete] = useState(false);
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExportData = async () => {
    setMessage('');
    setError('');
    setLoadingExport(true);
    try {
      const response = await auth.exportData();
      const dataStr = JSON.stringify(response.data, null, 2);
      
      // Trigger file download
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bearly_trading_gdpr_export_${user?.username || 'user'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage('Your personal data archive has been generated and downloaded successfully.');
    } catch (err) {
      setError('Failed to export personal data.');
    } finally {
      setLoadingExport(false);
    }
  };

  const handleVerifyEmail = async () => {
    setMessage('');
    setError('');
    setLoadingVerification(true);
    try {
      await verifyEmail();
      setMessage('Your email address has been successfully verified (simulated).');
    } catch (err) {
      setError(err || 'Failed to verify email.');
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleDeleteAccount = async () => {
    setMessage('');
    setError('');
    try {
      await deleteAccount();
      // AuthContext will handle state cleanup and logout automatically
      window.location.href = '/login';
    } catch (err) {
      setError('Failed to delete account. Contact system support.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white font-sans bg-gray-950 min-h-screen">
      
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Security & Compliance Control Panel</h1>
        <p className="text-gray-400 mt-1">Configure verification parameters and manage GDPR data privacy workflows.</p>
      </div>

      {message && <div className="bg-green-900/40 border border-green-800 text-green-300 p-4 rounded-xl text-xs">✅ {message}</div>}
      {error && <div className="bg-red-900/40 border border-red-800 text-red-300 p-4 rounded-xl text-xs">⚠️ {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Compliance Actions */}
        <div className="md:col-span-7 space-y-6">
          
          {/* Email Verification Box */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-gray-850 pb-3">
              <Mail className="w-5 h-5 text-blue-500" />
              Identity Verification
            </h3>
            
            <div className="flex justify-between items-center bg-gray-950 p-4 rounded-xl border border-gray-850">
              <div>
                <p className="text-sm font-semibold text-white">Email Address: {user?.email}</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  {user?.emailVerified ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500 fill-green-500/10" />
                      <span className="text-xs text-green-400 font-semibold">Verified</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-yellow-400 font-semibold">Verification Pending</span>
                    </>
                  )}
                </div>
              </div>
              {!user?.emailVerified && (
                <button
                  onClick={handleVerifyEmail}
                  disabled={loadingVerification}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  {loadingVerification ? 'Verifying...' : 'Verify Email'}
                </button>
              )}
            </div>
          </div>

          {/* GDPR / CCPA Portability Box */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-gray-850 pb-3">
              <Shield className="w-5 h-5 text-purple-500" />
              GDPR & Data Privacy
            </h3>
            
            <p className="text-xs text-gray-400 leading-relaxed font-normal">
              In accordance with general data protection regulations (GDPR and CCPA), you have the right to portability (exporting all trades, watches, and audit items) or the right to be forgotten (completely deleting all data from active databases).
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleExportData}
                disabled={loadingExport}
                className="flex-1 py-3 px-4 bg-gray-950 hover:bg-gray-850 border border-gray-850 text-xs font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-purple-400" />
                {loadingExport ? 'Generating Archive...' : 'Export Personal Data'}
              </button>

              {!verifyingDelete ? (
                <button
                  onClick={() => setVerifyingDelete(true)}
                  className="flex-1 py-3 px-4 bg-red-950/20 hover:bg-red-950/45 border border-red-900 text-xs font-bold rounded-xl text-red-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Request Account Deletion
                </button>
              ) : (
                <div className="flex-1 p-3 bg-red-950/30 border border-red-900 rounded-xl space-y-3">
                  <p className="text-[11px] text-red-300 font-semibold leading-snug">⚠️ This will delete your trades, cash logs, and watchlist. This cannot be undone.</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setVerifyingDelete(false)}
                      className="flex-1 py-1.5 bg-gray-950 border border-gray-850 text-[10px] font-bold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg"
                    >
                      Confirm Purge
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Legal & Cookie Consent Panel */}
        <div className="md:col-span-5 space-y-6">
          
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-gray-850 pb-3">
              <Cookie className="w-5 h-5 text-amber-500 fill-amber-500/10" />
              Cookie & Site Consent
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-normal">
              We use secure, HttpOnly session cookies exclusively for authentication, CSRF validation, and refresh token rotation. We do not engage in tracking or data harvesting.
            </p>
            <div className="flex items-center space-x-2 text-xs text-green-400 bg-green-950/25 border border-green-900/40 p-3 rounded-xl">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Consent Verified: Strict Authentication Only</span>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-gray-850 pb-3">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Regulatory Disclosures
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed font-normal">
              Bearly Trading is an educational virtual stock trading platform. No real-money transactions are processed, and we do not represent a licensed broker or financial advisor. All market rates are simulated.
            </p>
            
            <div className="space-y-2 pt-1 border-t border-gray-850">
              <a href="#privacy" className="text-xs text-gray-500 hover:text-blue-400 flex items-center justify-between group py-1">
                <span>Privacy Statement</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
              <a href="#terms" className="text-xs text-gray-500 hover:text-blue-400 flex items-center justify-between group py-1">
                <span>Terms of Service</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;
