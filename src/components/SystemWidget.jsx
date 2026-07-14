import React from 'react';
import { useGameState } from '../context/gameStateContext';

const SystemWidget = () => {
  const { systemType, systemData, updateSystemData, coins, setCoins } = useGameState();

  const handleAction = () => {
    if (systemType === 'Gacha') {
        if (coins >= 100) {
            setCoins(coins - 100);
            updateSystemData({ gachaPity: Math.min(100, systemData.gachaPity + 10) });
            alert("Spun Gacha for 100 Coins! Result injected into Skills Deck.");
        } else {
            alert("Not enough Sovereign Coins to spin! (Need 100)");
        }
    }
    if (systemType === 'Combat') updateSystemData({ combatMandates: systemData.combatMandates + 1 });
    if (systemType === 'Sign-In') updateSystemData({ signInTerritories: systemData.signInTerritories + 1 });
    if (systemType === 'Mercenary') {
        const newStatus = systemData.mercBattalionStatus === "Idle" ? "Deployed" : "Idle";
        updateSystemData({ mercBattalionStatus: newStatus });
    }
    if (systemType === 'Slacker') updateSystemData({ slackerComfort: Math.min(100, systemData.slackerComfort + 10) });
  };

  return (
    <div className="system-widget">
      <h4>{systemType} System</h4>
      
      {systemType === 'Gacha' && (
        <div className="widget-content">
          <p>Pity Meter: {systemData.gachaPity}%</p>
          <button className="widget-btn" onClick={handleAction}>Spin System Wheel (100 Coins)</button>
        </div>
      )}
      
      {systemType === 'Combat' && (
        <div className="widget-content">
          <p>Combat Mandates Cleared: {systemData.combatMandates}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Crises occur dynamically based on Game Master narrative.</p>
        </div>
      )}

      {systemType === 'Mercenary' && (
        <div className="widget-content">
          <p>Shadow Battalion Status: {systemData.mercBattalionStatus}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Dispatched organically during narrative combat.</p>
        </div>
      )}

      {systemType === 'Slacker' && (
        <div className="widget-content">
          <p>Comfort Meter: {systemData.slackerComfort}%</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Comfort passively regenerates when resting in narrative.</p>
        </div>
      )}

      {systemType === 'Sign-In' && (
        <div className="widget-content">
          <p>Territories Conquered: {systemData.signInTerritories}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Sign-in rewards trigger upon entering new narrative zones.</p>
        </div>
      )}
    </div>
  );
};

export default SystemWidget;
