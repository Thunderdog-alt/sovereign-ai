import React, { useState, useEffect } from 'react';
import PlayerStats from './PlayerStats';
import InteractiveExtensions from './InteractiveExtensions';
import SystemWidget from './SystemWidget';
import { useGameState } from '../context/gameStateContext';
import { LogOut, Archive, ChevronDown, ChevronUp } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3000`;

const SystemHUD = ({ onExit, lobbyConfig }) => {
  const { world, systemType, level, auraState, setAuraState, characterName, avatarImage, debuffs } = useGameState();
  
  const [vaultOpen, setVaultOpen] = useState(false);
  const [vault, setVault] = useState(null);
  const [vaultLoading, setVaultLoading] = useState(false);

  const loadVault = async () => {
    if (!lobbyConfig?.lobbyId) return;
    setVaultLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/vault/${lobbyConfig.lobbyId}`);
      const data = await res.json();
      setVault(data);
    } catch (e) {
      setVault({ archive: 'Failed to load vault.', archived_count: 0 });
    } finally {
      setVaultLoading(false);
    }
  };

  const toggleVault = () => {
    if (!vaultOpen && !vault) loadVault();
    setVaultOpen(v => !v);
  };

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
      
      {/* Active Debuffs / Injuries */}
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

      {/* Memory Vault Viewer */}
      <div style={{ marginTop: '20px', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
        <button
          onClick={toggleVault}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'rgba(0, 240, 255, 0.06)',
            border: 'none', color: 'var(--accent-cyan)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Archive size={16} />
            Memory Vault
            {vault && vault.archived_count > 0 && (
              <span style={{
                background: 'rgba(0,240,255,0.15)', border: '1px solid rgba(0,240,255,0.4)',
                borderRadius: '20px', padding: '2px 8px', fontSize: '0.7rem', color: 'var(--accent-cyan)'
              }}>
                {vault.archived_count} msgs archived
              </span>
            )}
          </span>
          {vaultOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {vaultOpen && (
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', maxHeight: '300px', overflowY: 'auto' }}>
            {vaultLoading ? (
              <p style={{ color: 'rgba(148,163,184,0.6)', textAlign: 'center', fontSize: '0.85rem' }}>
                Loading vault...
              </p>
            ) : vault && vault.archive ? (
              <>
                <p style={{ color: 'rgba(148,163,184,0.5)', fontSize: '0.7rem', margin: '0 0 10px', letterSpacing: '1px' }}>
                  {vault.archived_count} message(s) archived — all conversations that fell past message #650 are preserved here.
                  Last updated: {vault.last_updated ? new Date(vault.last_updated).toLocaleString() : 'never'}
                </p>
                <pre style={{
                  color: 'rgba(148,163,184,0.8)', fontSize: '0.75rem', whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace', lineHeight: '1.6', margin: 0,
                  borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px'
                }}>
                  {vault.archive}
                </pre>
                <button
                  onClick={loadVault}
                  style={{
                    marginTop: '12px', background: 'transparent',
                    border: '1px solid rgba(0,240,255,0.3)', color: 'var(--accent-cyan)',
                    padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem'
                  }}
                >
                  ↻ Refresh Vault
                </button>
              </>
            ) : (
              <p style={{ color: 'rgba(148,163,184,0.5)', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
                No archived messages yet. The vault fills up when your chat exceeds 650 messages.
                <br />
                <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Message #651 will be the first one moved here.</span>
              </p>
            )}
          </div>
        )}
      </div>

      <SystemWidget />
      <InteractiveExtensions />
    </div>
  );
};

export default SystemHUD;
