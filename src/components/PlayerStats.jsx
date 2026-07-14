import React from 'react';
import { useGameState } from '../context/gameStateContext';

const PlayerStats = () => {
  const { hp, maxHp, mp, maxMp, xp, level, coins, stats, setStats } = useGameState();
  
  const xpPercent = Math.min(100, (xp / (100 * level)) * 100);
  const hpPercent = Math.min(100, (hp / maxHp) * 100);
  const mpPercent = Math.min(100, (mp / maxMp) * 100);

  return (
    <div className="player-stats-container">
      <div className="core-bars">
        <div className="bar-wrapper hp-bar-wrapper">
          <span className="bar-label">HP</span>
          <div className="bar-bg"><div className="bar-fill hp-fill" style={{width: `${hpPercent}%`}}></div></div>
          <span className="bar-value">{hp}/{maxHp}</span>
        </div>
        <div className="bar-wrapper mp-bar-wrapper">
          <span className="bar-label">MP</span>
          <div className="bar-bg"><div className="bar-fill mp-fill" style={{width: `${mpPercent}%`}}></div></div>
          <span className="bar-value">{mp}/{maxMp}</span>
        </div>
        <div className="bar-wrapper xp-bar-wrapper">
          <span className="bar-label">XP</span>
          <div className="bar-bg"><div className="bar-fill xp-fill" style={{width: `${xpPercent}%`}}></div></div>
          <span className="bar-value">{xpPercent.toFixed(1)}%</span>
        </div>
      </div>

      <div className="core-stats">
        {['STR', 'AGI', 'STA', 'INT', 'LUK'].map(stat => (
          <div key={stat} className="stat-pill" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {stat}: {stats[stat]}
            {stats.Unassigned > 0 && (
              <button 
                onClick={() => setStats(s => ({ ...s, [stat]: s[stat] + 1, Unassigned: s.Unassigned - 1 }))}
                style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
              >
                +
              </button>
            )}
          </div>
        ))}
        {stats.Unassigned > 0 && (
          <div className="stat-pill" style={{ color: 'var(--accent-magenta)', borderColor: 'var(--accent-magenta)' }}>Unassigned: {stats.Unassigned}</div>
        )}
        <div className="stat-pill gold">SOVEREIGN COINS: {coins}</div>
      </div>
    </div>
  );
};

export default PlayerStats;
