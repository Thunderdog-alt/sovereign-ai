import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/gameStateContext';
import { User } from 'lucide-react';

const LobbyScreen = ({ onStart }) => {
  const { 
    world, 
    systemType, setSystemType,
    gameMode, setGameMode,
    avatarImage, setAvatarImage
  } = useGameState();
  
  const [lobbyMode, setLobbyMode] = useState('single');
  const [lobbyId, setLobbyId] = useState('');
  const [timeLimit, setTimeLimit] = useState('0');
  
  const [avatarDesc, setAvatarDesc] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const isPureLife = world === "Pure Life Roleplay";

  useEffect(() => {
    if (isPureLife) {
      setSystemType('None');
      setGameMode('Start from Scratch');
    }
  }, [isPureLife, setSystemType, setGameMode]);

  const handleStart = () => {
    onStart({
      mode: lobbyMode,
      lobbyId: lobbyMode === 'single' ? `single_${Date.now()}` : lobbyId || `multi_${Date.now()}`,
      timeLimit: parseInt(timeLimit),
      systemType,
      gameMode,
      avatarImage
    });
  };

  const handleGenerateAvatar = () => {
    if (!avatarDesc.trim()) return;
    setIsGeneratingAvatar(true);
    const prompt = `Anime manga style character portrait, masterpiece, high quality, ${avatarDesc}`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=400&nologo=true&seed=${Math.random()}`;
    
    // Pre-load image to show when ready
    const img = new Image();
    img.src = url;
    img.onload = () => {
      setAvatarImage(url);
      setIsGeneratingAvatar(false);
    };
  };

  return (
    <div className="start-container" style={{ padding: '2rem', display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
      
      {/* Avatar Panel */}
      <div className="glass-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ color: 'var(--accent-cyan)' }}>Your Avatar</h3>
        <div style={{ 
          width: '100%', height: '300px', background: 'rgba(0,0,0,0.5)', 
          border: '1px solid var(--glass-border)', borderRadius: '12px',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden', backgroundImage: `url('${avatarImage}')`, backgroundSize: 'cover', backgroundPosition: 'center'
        }}>
          {!avatarImage && !isGeneratingAvatar && <User size={60} color="var(--text-muted)" />}
          {isGeneratingAvatar && <div className="btn-glow" style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>}
        </div>
        <textarea 
          className="chat-input" 
          placeholder="Describe your character's appearance..."
          value={avatarDesc}
          onChange={e => setAvatarDesc(e.target.value)}
          style={{ height: '100px', resize: 'none' }}
        />
        <button 
          className="connect-btn" 
          onClick={handleGenerateAvatar} 
          disabled={!avatarDesc.trim() || isGeneratingAvatar}
          style={{ fontSize: '0.9rem', padding: '10px' }}
        >
          {isGeneratingAvatar ? 'Manifesting...' : 'Generate Avatar'}
        </button>
      </div>

      {/* Lobby Configuration */}
      <div className="glass-panel" style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 className="title-text" style={{ fontSize: '2rem' }}>Reality Configuration</h2>
        <h4 style={{ color: 'var(--accent-cyan)' }}>Destination: {world}</h4>
        
        {/* Connection Type */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            className={`connect-btn ${lobbyMode === 'single' ? 'active' : ''}`}
            onClick={() => setLobbyMode('single')}
            style={lobbyMode === 'single' ? { background: 'var(--accent-cyan)', color: '#000' } : {}}
          >
            Single Player
          </button>
          <button 
            className={`connect-btn ${lobbyMode === 'multi' ? 'active' : ''}`}
            onClick={() => setLobbyMode('multi')}
            style={lobbyMode === 'multi' ? { background: 'var(--accent-cyan)', color: '#000' } : {}}
          >
            Multiplayer
          </button>
        </div>

        {lobbyMode === 'multi' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Lobby ID (Leave blank to host new)</label>
              <input 
                type="text" 
                value={lobbyId}
                onChange={e => setLobbyId(e.target.value)}
                className="chat-input"
                placeholder="Enter Lobby ID..."
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Turn Time Limit</label>
              <select 
                value={timeLimit} 
                onChange={e => setTimeLimit(e.target.value)}
                className="chat-input"
                style={{ width: '100%' }}
              >
                <option value="0">None (Wait endlessly)</option>
                <option value="60">1 Minute</option>
                <option value="180">3 Minutes</option>
              </select>
            </div>
          </div>
        )}

        {/* System & Mode Selection */}
        {!isPureLife ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Select System Path:</label>
              <select value={systemType} onChange={(e) => setSystemType(e.target.value)} className="chat-input" style={{ width: '100%' }}>
                <option value="None">None (Awakenable)</option>
                <option value="Combat">The Sovereign Combat System</option>
                <option value="Slacker">The Slacker System</option>
                <option value="Sign-In">The Sign-In System</option>
                <option value="Mercenary">The Mercenary System</option>
                <option value="Gacha">The Gacha Manifestation System</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Game Mode:</label>
              <select value={gameMode} onChange={(e) => setGameMode(e.target.value)} className="chat-input" style={{ width: '100%' }}>
                <option value="Start from Scratch">Start from Scratch (Grounded)</option>
                <option value="God Mode">God Mode (Absolute Control)</option>
              </select>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', border: '1px solid var(--accent-magenta)', borderRadius: '8px', background: 'rgba(255, 0, 255, 0.05)' }}>
            <p style={{ color: 'var(--accent-magenta)', margin: 0, textAlign: 'center', fontSize: '0.9rem' }}>
              <strong>Pure Life Restrictions Active</strong><br/>
              No System. Start from Scratch. Awaken manually if desired.
            </p>
          </div>
        )}

        <button className="connect-btn" style={{ marginTop: '1rem', padding: '1.2rem', fontSize: '1.2rem' }} onClick={handleStart}>
          <span className="btn-text">ENTER REALITY</span>
          <div className="btn-glow"></div>
        </button>
      </div>
    </div>
  );
};

export default LobbyScreen;
