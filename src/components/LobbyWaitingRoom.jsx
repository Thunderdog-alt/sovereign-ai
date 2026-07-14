import React, { useEffect, useState } from 'react';
import { useGameState } from '../context/gameStateContext';
import { Users, Play } from 'lucide-react';

const LobbyWaitingRoom = ({ lobbyConfig, socket, onGameStarted }) => {
  const { characterName } = useGameState();
  const [lobbyState, setLobbyState] = useState(null);

  useEffect(() => {
    socket.emit('join_lobby', { ...lobbyConfig, username: characterName });

    const handleLobbyState = (state) => {
      setLobbyState(state);
      if (state.status === 'playing') {
        onGameStarted();
      }
    };

    socket.on('lobby_state', handleLobbyState);
    socket.on('game_started', onGameStarted);

    return () => {
      socket.off('lobby_state', handleLobbyState);
      socket.off('game_started', onGameStarted);
    };
  }, [socket, lobbyConfig, characterName, onGameStarted]);

  if (!lobbyState) return <div className="start-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Connecting...</div>;

  const isHost = lobbyState.host === characterName;

  return (
    <div className="start-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '500px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--accent-cyan)' }}>LOBBY: {lobbyConfig.world}</h2>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Users size={18}/> Connected Players ({lobbyState.players.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {lobbyState.players.map(p => (
              <li key={p} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{p}</span>
                {p === lobbyState.host && <span style={{ color: 'var(--accent-magenta)', fontSize: '0.8rem' }}>HOST</span>}
              </li>
            ))}
          </ul>
        </div>
        
        {isHost ? (
          <button 
            className="hero-btn create-world-btn" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '1rem' }}
            onClick={() => socket.emit('start_game', { lobbyId: lobbyConfig.lobbyId, username: characterName })}
          >
            <Play size={20} /> START REALITY
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', border: '1px dashed var(--glass-border)', borderRadius: '4px' }}>
            Waiting for Host to start...
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyWaitingRoom;
