import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import BearLogo from './BearLogo';

const Login = () => {
  const [error, setError] = useState('');
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to login with Google');
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-800 rounded-lg shadow-xl">
        <div className="flex flex-col items-center">
          <BearLogo className="w-20 h-20" />
          <h2 className="mt-6 text-3xl font-bold text-white">Welcome to Bear Trading</h2>
          <p className="mt-2 text-sm text-gray-400 text-center">
            Sign in with your Google account to start trading
          </p>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded-md text-center">
            {error}
          </div>
        )}

        <div className="mt-8">
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              text="continue_with"
              width="350"
            />
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            🔒 Secure authentication powered by Google
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Your information is protected and we never see your password
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;