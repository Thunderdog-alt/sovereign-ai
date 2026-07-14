import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen';
import StartScreen from './components/StartScreen';
import Sidebar from './components/Sidebar';
import ChatEngine from './components/ChatEngine';
import AuthScreen from './components/AuthScreen';
import LobbyScreen from './components/LobbyScreen';
import MultiplayerHub from './components/MultiplayerHub';
import { GameStateProvider } from './context/gameStateContext';
import { Menu } from 'lucide-react';
import PersonaSetup from './components/PersonaSetup';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

function AppContent() {
  const [appState, setAppState] = useState('auth'); // auth, splash, start, persona, lobby, multiplayer, chat
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lobbyConfig, setLobbyConfig] = useState(null);
  const [pendingWorld, setPendingWorld] = useState(null);

  useEffect(() => {
    // Auto-login check
    if (appState === 'auth') {
      const token = localStorage.getItem('sov_token');
      const username = localStorage.getItem('sov_username');
      if (token && username) {
        setAppState('start'); // Skip splash if auto-logging in
      }
    }
  }, [appState]);

  return (
    <div className="app-root">
      {appState !== 'auth' && appState !== 'splash' && (
        <>
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <Sidebar
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(false)}
            onHome={() => {
              setAppState('start');
              setSidebarOpen(false);
            }}
          />
        </>
      )}

      {appState === 'auth' && (
        <AuthScreen onLogin={() => setAppState('splash')} />
      )}
      {appState === 'splash' && (
        <SplashScreen onComplete={() => setAppState('start')} />
      )}
      {appState === 'start' && (
        <StartScreen onWorldSelect={(worldName) => {
          setPendingWorld(worldName);
          setAppState('persona');
        }} />
      )}
      {appState === 'persona' && (
        <PersonaSetup 
          onCancel={() => setAppState('start')}
          onComplete={() => {
            if (pendingWorld === 'Multiplayer Hub') {
              setAppState('multiplayer');
            } else {
              setAppState('lobby');
            }
          }}
        />
      )}
      {appState === 'multiplayer' && (
        <MultiplayerHub onJoin={(config) => {
          setLobbyConfig(config);
          setAppState('chat');
        }} onBack={() => setAppState('start')} />
      )}
      {appState === 'lobby' && (
        <LobbyScreen onStart={(config) => {
          setLobbyConfig(config);
          setAppState('chat');
        }} />
      )}
      {appState === 'chat' && (
        <ChatEngine onExit={() => setAppState('start')} lobbyConfig={lobbyConfig} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameStateProvider>
        <AppContent />
      </GameStateProvider>
    </ErrorBoundary>
  );
}
