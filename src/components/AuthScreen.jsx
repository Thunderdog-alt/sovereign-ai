import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useGameState } from '../context/gameStateContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3000`;

const AuthScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  
  const { setUsername: setGlobalUsername } = useGameState();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      localStorage.setItem('sov_token', data.token);
      localStorage.setItem('sov_username', data.username);
      setGlobalUsername(data.username);
      
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div className="auth-container splash-container" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="auth-box glass-panel" style={{ width: '400px', padding: '3rem', textAlign: 'center', borderRadius: '20px', border: '1px solid rgba(0, 255, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 255, 255, 0.1)' }}>
        <ShieldAlert size={60} className="auth-icon" style={{color: 'var(--accent-cyan)', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px var(--accent-cyan))'}} />
        <h2 className="title-text" style={{fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '4px'}}>SOVEREIGN</h2>
        <p className="subtitle" style={{marginBottom: '2rem', color: 'var(--text-muted)'}}>Authentication Required</p>
        
        <form onSubmit={handleAuth} className="auth-form" style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <GoogleLogin
              onSuccess={credentialResponse => {
                try {
                  const decoded = jwtDecode(credentialResponse.credential);
                  // In a real app, you'd send this to the backend. Here we auto-login visually.
                  const googleUsername = decoded.email;
                  localStorage.setItem('sov_token', credentialResponse.credential);
                  localStorage.setItem('sov_username', googleUsername);
                  setGlobalUsername(googleUsername);
                  onLogin();
                } catch (e) {
                  setError("Google Login failed to decode.");
                }
              }}
              onError={() => {
                setError("Google Login Failed.");
              }}
              theme="filled_black"
              shape="pill"
              text="signin_with"
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
            <span style={{ margin: '0 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          </div>

          <input 
            type="text" 
            placeholder="Username / Email" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="chat-input auth-input"
            style={{textAlign: 'left', fontSize: '1rem', padding: '12px', position: 'relative', zIndex: 10}}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="chat-input auth-input"
            style={{textAlign: 'left', fontSize: '1rem', padding: '12px', position: 'relative', zIndex: 10}}
            required
          />
          {error && <p className="auth-error" style={{color: 'var(--accent-magenta)', fontSize: '0.9rem', textAlign: 'left', position: 'relative', zIndex: 10}}>{error}</p>}
          <button id="auth-submit-btn" type="submit" className="connect-btn auth-btn" style={{ padding: '12px', marginTop: '10px', position: 'relative', zIndex: 10 }}>
            <span className="btn-text">{isRegister ? 'REGISTER' : 'LOG IN'}</span>
            <div className="btn-glow"></div>
          </button>
        </form>
        <p 
          className="auth-hint" 
          style={{marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', transition: '0.2s'}}
          onClick={() => setIsRegister(!isRegister)}
          onMouseOver={(e) => e.target.style.color = 'var(--accent-cyan)'}
          onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
        >
          {isRegister ? 'Already have an account? Log in' : 'Need an account? Register'}
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
