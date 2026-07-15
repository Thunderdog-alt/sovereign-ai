import React, { useState } from 'react';
import { useGameState } from '../context/gameStateContext';
import { unlockAudio, playSound } from '../utils/AudioManager';

// IMPORTANT: Replace this with your OAuth Client ID from Google Cloud Console
// Go to: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0887101933
// Create a Web Application OAuth Client ID and paste it below:
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3000`;

// --- Google OAuth Helper ---
const GEMINI_SCOPE = 'https://www.googleapis.com/auth/generative-language openid email profile';

const launchGoogleOAuth = () => {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('OAUTH_NOT_CONFIGURED'));
      return;
    }

    const redirectUri = window.location.origin;
    const state = Math.random().toString(36).slice(2);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token',  // Implicit grant — returns access_token directly
      scope: GEMINI_SCOPE,
      state,
      include_granted_scopes: 'true',
    });

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    const popup = window.open(oauthUrl, 'googleOAuth', 'width=500,height=600,left=200,top=100');

    const checkClosed = setInterval(() => {
      try {
        if (popup && popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Popup closed'));
          return;
        }
        if (popup && popup.location && popup.location.hash) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const returnedState = params.get('state');
          
          if (accessToken && returnedState === sessionStorage.getItem('oauth_state')) {
            popup.close();
            clearInterval(checkClosed);
            resolve(accessToken);
          }
        }
      } catch (e) {
        // Cross-origin error while OAuth is loading — ignore
      }
    }, 200);
  });
};

const AuthScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { setUsername: setGlobalUsername } = useGameState();

  const handleGoogleLogin = async () => {
    unlockAudio();
    playSound('click', 0.5);
    setError('');
    setIsGoogleLoading(true);

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error('OAUTH_NOT_CONFIGURED');
      }

      const accessToken = await launchGoogleOAuth();
      
      // Verify token and get user info
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const userInfo = await userRes.json();
      
      const displayName = userInfo.name || userInfo.email.split('@')[0];
      const email = userInfo.email;

      // Register / login on backend, storing the Google access token
      const res = await fetch(`${BACKEND_URL}/api/google-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: displayName, access_token: accessToken })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google auth failed');

      localStorage.setItem('sov_token', data.token);
      localStorage.setItem('sov_username', data.username);
      localStorage.setItem('sov_google_access_token', accessToken); // Store for Gemini use
      setGlobalUsername(data.username);
      onLogin();

    } catch (err) {
      if (err.message === 'OAUTH_NOT_CONFIGURED') {
        setError('Google Sign-In is not configured yet. Use username/password login below, or ask the admin to configure OAuth.');
      } else if (err.message === 'Popup closed') {
        setError('Sign-in cancelled.');
      } else {
        setError(`Google login failed: ${err.message}`);
      }
      setIsGoogleLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    unlockAudio();
    playSound('click', 0.5);

    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('sov_token', data.token);
      localStorage.setItem('sov_username', data.username);
      // Username/password users fall back to server API key
      setGlobalUsername(data.username);
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0a0a0a 0%, #0a0a1e 50%, #0a1a0a 100%)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', overflowY: 'auto', padding: '2rem 0',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px', pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '440px', margin: '0 20px',
        background: 'rgba(10, 10, 20, 0.9)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '24px',
        padding: '3rem', boxShadow: '0 0 60px rgba(0, 240, 255, 0.08), 0 25px 50px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '70px', height: '70px', margin: '0 auto 1rem',
            background: 'radial-gradient(circle, rgba(0,240,255,0.2), transparent)',
            border: '1px solid rgba(0,240,255,0.4)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem'
          }}>⚡</div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '2.8rem', fontWeight: 900,
            letterSpacing: '6px', color: '#fff', margin: 0,
            textShadow: '0 0 20px rgba(0,240,255,0.4)'
          }}>SOVEREIGN</h1>
          <p style={{ color: 'rgba(148,163,184,0.8)', letterSpacing: '4px', fontSize: '0.75rem', marginTop: '0.5rem', textTransform: 'uppercase' }}>
            AI Roleplay Engine
          </p>
        </div>

        {/* Google Sign In — PRIMARY */}
        <button
          id="google-signin-btn"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px',
            border: '1px solid rgba(0,240,255,0.3)',
            background: 'linear-gradient(135deg, rgba(0,240,255,0.1), rgba(0,100,255,0.1))',
            color: '#fff', fontWeight: 700, fontSize: '1rem',
            cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            marginBottom: '1.5rem', transition: 'all 0.3s',
            opacity: isGoogleLoading ? 0.7 : 1,
            letterSpacing: '1px'
          }}
          onMouseOver={e => { if (!isGoogleLoading) e.currentTarget.style.borderColor = 'rgba(0,240,255,0.8)'; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)'; }}
        >
          {isGoogleLoading ? (
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
            </svg>
          )}
          {isGoogleLoading ? 'Signing In...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.8rem', letterSpacing: '2px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Username/Password Form */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            id="username-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '1rem',
              outline: 'none', transition: 'border 0.3s'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <input
            id="password-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', padding: '12px 16px', color: '#fff', fontSize: '1rem',
              outline: 'none', transition: 'border 0.3s'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,240,255,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />

          {error && (
            <div style={{
              background: 'rgba(255,0,85,0.1)', border: '1px solid rgba(255,0,85,0.4)',
              borderRadius: '8px', padding: '10px 14px', color: '#ff8888', fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(0,240,255,0.05))',
              border: '1px solid rgba(0,240,255,0.4)', color: 'var(--accent-cyan, #00f0ff)',
              padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
              fontSize: '1rem', letterSpacing: '2px', transition: 'all 0.3s', textTransform: 'uppercase'
            }}
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>

          <button
            id="toggle-auth-mode"
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{
              background: 'transparent', border: 'none', color: 'rgba(148,163,184,0.7)',
              cursor: 'pointer', fontSize: '0.85rem', textAlign: 'center', padding: '4px'
            }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'rgba(100,100,120,0.6)', fontSize: '0.7rem', marginTop: '2rem', letterSpacing: '1px' }}>
          ANOMALY STUDIOS · SOVEREIGN AI ENGINE
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AuthScreen;
