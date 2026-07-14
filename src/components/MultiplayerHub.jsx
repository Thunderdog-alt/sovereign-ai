import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/gameStateContext';
import { Users, Server, Trash2, ArrowLeft } from 'lucide-react';

const MultiplayerHub = ({ onJoin, onBack }) => {
  const { username } = useGameState();
  const [lobbies, setLobbies] = useState([]);
  const [lobbyIdInput, setLobbyIdInput] = useState('');
  
  useEffect(() => {
    // In a full implementation, this would fetch active open lobbies from the server
    // For now, we simulate fetching public servers
    setLobbies([
      { id: 'public-rpg-1', name: 'Cyberpunk City Raid', host: 'Admin_Zero', players: 3 },
      { id: 'public-rpg-2', name: 'Fantasy Tavern Chill', host: 'MageLord', players: 8 }
    ]);
  }, []);

  const handleHost = () => {
    onJoin({
      mode: 'multi',
      lobbyId: `hosted_${Date.now()}`,
      timeLimit: 60,
      systemType: 'None',
      gameMode: 'Start from Scratch',
      isHost: true
    });
  };

  const handleJoin = (id) => {
    onJoin({
      mode: 'multi',
      lobbyId: id || lobbyIdInput,
      timeLimit: 60,
      systemType: 'None',
      gameMode: 'Start from Scratch',
      isHost: false
    });
  };

  return (
    <div className="start-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button 
        onClick={onBack}
        style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <div className="glass-panel" style={{ width: '800px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2 className="title-text" style={{ fontSize: '2.5rem', textAlign: 'center', margin: 0 }}>MULTIPLAYER HUB</h2>
        
        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* Join Private Lobby */}
          <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(0, 255, 255, 0.05)', border: '1px solid var(--accent-cyan)', borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '10px' }}><Server size={20}/> Private Connection</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Enter a specific Reality ID to join a private session.</p>
            <input 
              type="text" 
              className="chat-input" 
              placeholder="Reality ID..." 
              value={lobbyIdInput}
              onChange={e => setLobbyIdInput(e.target.value)}
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <button className="connect-btn" style={{ width: '100%' }} onClick={() => handleJoin()} disabled={!lobbyIdInput.trim()}>
              JOIN PRIVATE
            </button>
          </div>

          {/* Host Lobby */}
          <div style={{ flex: 1, padding: '1.5rem', background: 'rgba(255, 0, 255, 0.05)', border: '1px solid var(--accent-magenta)', borderRadius: '12px' }}>
            <h3 style={{ color: 'var(--accent-magenta)', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={20}/> Host Reality</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Create a new reality. As host, you can kick players and control time limits.</p>
            <button className="connect-btn" style={{ width: '100%', marginTop: 'auto' }} onClick={handleHost}>
              INITIALIZE SERVER
            </button>
          </div>
        </div>

        {/* Server Browser */}
        <div style={{ padding: '1.5rem', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Public Realities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lobbies.map(lobby => (
              <div key={lobby.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--accent-cyan)' }}>{lobby.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Host: {lobby.host}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <Users size={16}/> {lobby.players}/10
                  </span>
                  <button className="mode-btn" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => handleJoin(lobby.id)}>JOIN</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MultiplayerHub;
