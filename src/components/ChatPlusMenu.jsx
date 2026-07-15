import React from 'react';
import { User, Image as ImageIcon, Zap, Clock, MessageSquare, MicOff, Mic, Star } from 'lucide-react';
import { toggleMuteVoice, getIsMuted } from '../utils/VoiceReader';

const ChatPlusMenu = ({ 
  setHudOpen, 
  setPlusMenuOpen, 
  animeImageGenEnabled, 
  setAnimeImageGenEnabled, 
  auraState, 
  cycleAura, 
  socket, 
  lobbyConfig, 
  characterName, 
  username, 
  setIsWaiting 
}) => {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: '15%', marginBottom: '20px', 
      background: 'rgba(10, 10, 15, 0.98)', border: '1px solid var(--accent-cyan)',
      borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px',
      boxShadow: '0 0 40px rgba(0,240,255,0.2)', zIndex: 100, width: '320px', maxHeight: '500px', overflowY: 'auto'
    }}>
      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => { setAnimeImageGenEnabled(!animeImageGenEnabled); setPlusMenuOpen(false); }}>
        <ImageIcon size={18}/> {animeImageGenEnabled ? 'Disable Anime Gen' : 'Enable Anime Gen'}
      </button>
      
      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={cycleAura}>
        <Zap size={18} color={auraState === 'Release' ? 'red' : auraState === 'Hidden' ? 'gray' : 'cyan'}/> Aura: {auraState}
      </button>
      
      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => { 
        const muted = toggleMuteVoice();
        alert(muted ? 'Voice Reader Disabled' : 'Voice Reader Enabled');
        setPlusMenuOpen(false); 
      }}>
        {getIsMuted() ? <MicOff size={18}/> : <Mic size={18}/>} Toggle Voice Reader
      </button>

      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => {
        socket.emit('submit_action', { lobbyId: lobbyConfig.lobbyId, username: characterName || username, action: '[CONTINUE SEQUENCE - AI must progress the story without player input]' });
        setIsWaiting(true);
        setPlusMenuOpen(false);
      }}>
        <MessageSquare size={18}/> Continue Sequence
      </button>

      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => {
        socket.emit('submit_action', { lobbyId: lobbyConfig.lobbyId, username: characterName || username, action: '[SKIP TIME FORWARD]' });
        setIsWaiting(true);
        setPlusMenuOpen(false);
      }}>
        <Clock size={18}/> Skip Time
      </button>

      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => {
        const persona = prompt("Enter a new persona / identity you are roleplaying as (e.g., 'Angry Merchant', 'A dog', 'Shadow Assassin'):");
        if (persona) {
          socket.emit('submit_action', { lobbyId: lobbyConfig.lobbyId, username: characterName || username, action: `[SYSTEM: Player has changed their persona/identity to: ${persona}]` });
          setIsWaiting(true);
          setPlusMenuOpen(false);
        }
      }}>
        <User size={18}/> Switch Persona
      </button>

      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => {
        socket.emit('submit_action', { lobbyId: lobbyConfig.lobbyId, username: characterName || username, action: '[SWIPE REGENERATE]' });
        setIsWaiting(true);
        setPlusMenuOpen(false);
      }}>
        <MessageSquare size={18}/> Regenerate AI Response
      </button>

      <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => {
        const handleAwaken = () => {
          const scenario = prompt("Describe how you awaken a system:");
          if (scenario) {
            socket.emit('submit_action', { lobbyId: lobbyConfig.lobbyId, username: characterName || username, action: `[SYSTEM AWAKENING INITIATED]: ${scenario}` });
            setIsWaiting(true);
            setPlusMenuOpen(false);
          }
        };
        handleAwaken();
      }}>
        <Star size={18} color="gold"/> Trigger System Awakening
      </button>
    </div>
  );
};

export default ChatPlusMenu;
