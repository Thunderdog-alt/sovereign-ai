import React from 'react';
import PlayerStats from './PlayerStats';
import InteractiveExtensions from './InteractiveExtensions';
import SystemWidget from './SystemWidget';
import { useGameState } from '../context/gameStateContext';
import { LogOut } from 'lucide-react';

const SystemHUD = ({ onExit }) => {
  const { world, systemType, level, auraState, setAuraState, characterName, avatarImage, debuffs } = useGameState();

  return (
    <div className="system-hud">
      <header className="hud-header">
        <div className="hud-info">
          <span className="world-name">{world}</span>
          <span className="system-badge">{systemType} System</span>
          <span className="llm-tag">Gemini AI</span>
        </div>
        <button className="exit-btn" onClick={onExit}>
          <LogOut size={16} /> Exit
        </button>
      </header>

      <div className="identity-ribbon">
        <div className="avatar-placeholder" style={{ 
          backgroundImage: avatarImage ? `url('${avatarImage}')` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center',
          border: avatarImage ? '2px solid var(--accent-cyan)' : '2px dashed var(--glass-border)'
        }}>
          {!avatarImage && <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>No Avatar</span>}
        </div>
        <div className="player-details">
          <span className="player-name">{characterName || 'Unknown SOVEREIGN'}</span>
          <span className="player-level">Lvl {level}</span>
        </div>
        <div className="aura-toggle">
          <span>Aura</span>
          <select 
             value={auraState} 
             onChange={(e) => setAuraState(e.target.value)}
             className="aura-dropdown"
          >
            <option value="Release">Release (Full Power)</option>
            <option value="Normal">Normal (Mundane)</option>
            <option value="Hidden">Hidden (Stealth)</option>
          </select>
        </div>
      </div>

      <PlayerStats />
      
      {debuffs && debuffs.length > 0 && (
        <div style={{ marginTop: '15px', background: 'rgba(255, 0, 0, 0.08)', border: '1px solid #ff3333', padding: '12px', borderRadius: '8px' }}>
          <h4 style={{ color: '#ff4444', margin: '0 0 10px 0', fontSize: '0.9rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚠ Active Debuffs / Injuries
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {debuffs.map((debuff, idx) => (
              <span key={idx} style={{ background: 'rgba(255,51,51,0.2)', border: '1px solid #ff3333', color: '#ff8888', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {debuff}
              </span>
            ))}
          </div>
        </div>
      )}

      <SystemWidget />
      <InteractiveExtensions />
    </div>
  );
};

export default SystemHUD;
