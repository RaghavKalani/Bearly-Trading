import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import BearLogo from './BearLogo';
import { auth } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err || 'Failed to sign in. Please verify your credentials.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      setInfo('');
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err || 'Failed to login with Google');
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmittingReset(true);
    try {
      await auth.requestPasswordReset(resetEmail);
      setInfo('Password reset link sent to email (simulated in audit logs).');
      setIsResetting(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setSubmittingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans">
      <div className="max-w-md w-full space-y-6 p-8 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

        <div className="flex flex-col items-center relative z-10">
          <BearLogo className="w-16 h-16 text-blue-500 animate-pulse" />
          <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">Bearly Trading</h2>
          <p className="mt-1 text-sm text-gray-400 text-center">
            Simulated high-performance trading platform
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm text-center relative z-10">
            ⚠️ {error}
          </div>
        )}

        {info && (
          <div className="bg-green-900/50 border border-green-700 text-green-200 p-3 rounded-lg text-sm text-center relative z-10">
            ℹ️ {info}
          </div>
        )}

        {!isResetting ? (
          <form onSubmit={handleTraditionalLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setIsResetting(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-500 hover:to-purple-500 transform hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Sign In
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-800"></div>
              <span className="px-3 text-xs text-gray-500 uppercase">Or Continue With</span>
              <div className="flex-1 border-t border-gray-800"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                shape="pill"
                text="signin_with"
                width="380"
              />
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordResetRequest} className="space-y-4 relative z-10">
            <h3 className="text-lg font-bold text-white mb-2">Reset Password</h3>
            <p className="text-sm text-gray-400">
              Enter your registered email address below, and we'll simulate a password reset token.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsResetting(false)}
                className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold rounded-xl border border-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submittingReset}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-colors disabled:opacity-50"
              >
                {submittingReset ? 'Sending...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;