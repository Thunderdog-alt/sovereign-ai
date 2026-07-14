import React, { useState, useEffect } from 'react';
import { Shield, Target, Award, Map, Settings, Users, Ghost, Zap } from 'lucide-react';
import { useGameState } from '../context/gameStateContext';

const Sidebar = ({ isOpen, toggleSidebar, onHome }) => {
  const { username } = useGameState();
  const [historyLobbies, setHistoryLobbies] = useState([]);

  useEffect(() => {
    if (!username) return;
    fetch(`http://${window.location.hostname}:3000/api/lobbies?username=${username}`)
      .then(res => res.json())
      .then(data => setHistoryLobbies(data))
      .catch(err => console.error("Failed to load history:", err));
  }, [username]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }}
          onClick={toggleSidebar}
        />
      )}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ 
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 999, 
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', 
        transition: 'transform 0.3s ease-in-out'
      }}>
        <div className="sidebar-logo">
          <Shield size={28} className="logo-icon" />
          <span className="logo-text">SOVEREIGN</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <span className="nav-label">SYSTEM CORE</span>
            <button className="nav-item" onClick={onHome} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Target size={18} /> Home Dashboard
            </button>
            <a href="#" className="nav-item"><Award size={18} /> Authority Ranks</a>
          </div>

        <div className="nav-group">
          <span className="nav-label">ACTIVE THREADS</span>
          {historyLobbies.length === 0 ? (
            <p style={{ padding: '0 15px', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No active realities found.</p>
          ) : (
            historyLobbies.map((lobbyId, i) => (
              <a href="#" key={i} className="nav-item history-item">
                <span className="status-dot"></span>
                <span className="history-text">{lobbyId}</span>
              </a>
            ))
          )}
        </div>

        <div className="nav-group">
          <span className="nav-label">NETWORK</span>
          <a href="#" className="nav-item"><Users size={18} /> Syndicate Hub</a>
          <a href="#" className="nav-item"><Ghost size={18} /> Anomalies</a>
          <a href="#" className="nav-item"><Zap size={18} /> Market Exchange</a>
        </div>
      </nav>

      <div className="sidebar-footer">
        <a href="#" className="nav-item"><Settings size={18} /> System Config</a>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
