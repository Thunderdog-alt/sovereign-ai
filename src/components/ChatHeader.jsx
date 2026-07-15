import React from 'react';
import { User, Clock } from 'lucide-react';

const ChatHeader = ({ 
  setHudOpen, 
  characterName, 
  username, 
  world, 
  lobbyConfig, 
  lobbyState, 
  timeLeft, 
  animeImageGenEnabled, 
  imageTokens, 
  systemType 
}) => {
  return (
    <div className="world-banner">
      <div className="world-banner-overlay">
         <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
           <button 
             onClick={() => setHudOpen(true)}
             style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
           >
             <User size={24} color="var(--accent-cyan)" />
             <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>{characterName || username}</span>
           </button>
           
           <h3 style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
             {world}
           </h3>
           
           {lobbyConfig.mode === 'multi' && lobbyState && lobbyState.players && lobbyState.players.length > 1 && (
             <div className="multiplayer-status" style={{ marginLeft: '20px' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--accent-magenta)', fontWeight: 'bold', letterSpacing: '1px' }}>LOBBY</span>
               {lobbyState.players.map(p => {
                 const isReady = lobbyState.pendingActions?.find(a => a.username === p);
                 return (
                   <span key={p} className={`player-tick ${isReady ? 'ready' : 'waiting'}`}>
                     {p} {isReady ? '✓' : '...'}
                   </span>
                 );
               })}
             </div>
           )}
         </div>
         
         <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
           {timeLeft !== null && (
             <div className="timer-pulse">
               <Clock size={20} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
               {timeLeft}s
             </div>
           )}
           
           <div style={{ textAlign: 'right' }}>
             {animeImageGenEnabled && imageTokens === 0 ? (
               <p style={{color: 'var(--accent-magenta)', fontSize: '0.9rem'}}>Image Gen Exhausted</p>
             ) : (
               <p style={{color: 'var(--accent-cyan)', fontSize: '0.9rem'}}>Tokens: {imageTokens} | Mode: {lobbyConfig.gameMode} | System: {systemType}</p>
             )}
           </div>
         </div>
      </div>
    </div>
  );
};

export default ChatHeader;
