import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatMessage from './ChatMessage';
import SystemHUD from './SystemHUD';
import TutorialOverlay from './TutorialOverlay';
import { useGameState } from '../context/gameStateContext';
import { User, Image as ImageIcon, Send, Clock, Plus, Zap, Star, MessageSquare } from 'lucide-react';
import { socket } from '../socket';

const ChatEngine = ({ onExit, lobbyConfig }) => {
  const { world, systemType, setSystemType, auraState, setAuraState, parseRewardTags, username, skills } = useGameState();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  
  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem('sov_tutorial_done'));
  const messagesEndRef = useRef(null);

  const [imageTokens, setImageTokens] = useState(5);
  const [animeImageGenEnabled, setAnimeImageGenEnabled] = useState(true);

  const [currentWorldImage, setCurrentWorldImage] = useState(
    `https://image.pollinations.ai/prompt/Cinematic%20environment%20concept%20art%20of%20${encodeURIComponent(world || 'Fantasy RPG world')}%20dark%20aesthetic?width=1200&height=400&nologo=true`
  );

  const [lobbyState, setLobbyState] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.emit('join_lobby', { 
      lobbyId: lobbyConfig.lobbyId, 
      username: characterName || username, 
      world, 
      timeLimit: lobbyConfig.timeLimit,
      systemType: lobbyConfig.systemType,
      gameMode: lobbyConfig.gameMode
    });

    socket.on('lobby_state', (state) => {
      setLobbyState(state);
    });

    socket.on('action_received', ({ username: user, action }) => {
      setMessages(prev => [...prev, { role: 'user', content: action, sender: user }]);
      scrollToBottom();
    });

    socket.on('turn_resolved', ({ actions, resolution }) => {
      setIsWaiting(false);
      const cleanText = parseRewardTags(resolution);
      setMessages(prev => [...prev, { role: 'assistant', content: cleanText, sender: 'Game Master' }]);
      scrollToBottom();

      if (animeImageGenEnabled && imageTokens > 0) {
        setImageTokens(t => t - 1);
        const playerAction = actions && actions.length > 0 ? actions[0].action : "standing still";
        const animePrompt = `90s anime aesthetic, dynamic action scene, high quality, cinematic: ${world} scene where character is ${playerAction} resulting in: ${resolution.substring(0, 100)}`;
        setCurrentWorldImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(animePrompt)}?width=1200&height=400&nologo=true&seed=${Math.random()}`);
      }
    });

    socket.on('error', (err) => {
      setIsWaiting(false);
      alert('System Error: ' + err);
    });

    return () => socket.disconnect();
  }, [lobbyConfig, characterName, username, world, systemType, animeImageGenEnabled, imageTokens]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const completeTutorial = () => {
    localStorage.setItem('sov_tutorial_done', 'true');
    setShowTutorial(false);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isWaiting) return;
    
    // Inject Aura state info if not normal
    let finalAction = inputValue;
    if (auraState === 'Release') {
      finalAction = `[AURA RELEASED - Full Power Displayed] ${finalAction}`;
    } else if (auraState === 'Hidden') {
      finalAction = `[AURA HIDDEN - Completely Concealed] ${finalAction}`;
    }

    socket.emit('submit_action', { lobbyId: lobbyConfig.lobbyId, username: characterName || username, action: finalAction });
    setInputValue('');
    setIsWaiting(true);
  };

  const cycleAura = () => {
    if (auraState === 'Normal') setAuraState('Release');
    else if (auraState === 'Release') setAuraState('Hidden');
    else setAuraState('Normal');
  };

  const handleAwaken = () => {
    const scenario = prompt("Describe how you awaken a system (e.g., 'I am struck by lightning', 'A goddess appears'):");
    if (scenario) {
      setSystemType("Custom Awaken");
      setPlusMenuOpen(false);
      socket.emit('submit_action', { lobbyId: lobbyConfig.lobbyId, username, action: `[SYSTEM AWAKENING INITIATED]: ${scenario}` });
      setIsWaiting(true);
    }
  };

  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!lobbyState || !lobbyState.turnStartTime || lobbyState.timeLimit <= 0) {
      setTimeLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const elapsed = (Date.now() - lobbyState.turnStartTime) / 1000;
      const rem = Math.max(0, lobbyState.timeLimit - elapsed);
      setTimeLeft(Math.ceil(rem));
    }, 1000);
    return () => clearInterval(interval);
  }, [lobbyState]);

  return (
    <div className="chat-engine-container" style={{ backgroundImage: `url('${currentWorldImage}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {showTutorial && <TutorialOverlay onComplete={completeTutorial} />}

      <div className={`player-profile-overlay ${hudOpen ? 'open' : 'closed'}`}>
        <div className="player-profile-modal">
          <button className="close-profile-btn" onClick={() => setHudOpen(false)}>X</button>
          <SystemHUD onExit={onExit} />
        </div>
      </div>

      <div className="chat-panel">
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

        <div className="chat-history" onClick={() => setPlusMenuOpen(false)}>
          {messages.length === 0 && (
            <div className="empty-state">
              <p>Reality initialized. What is your first move?</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={{...msg, sender: msg.role === 'user' ? msg.sender : 'Game Master'}} />
          ))}
          {isWaiting && (
            <div className="chat-message assistant">
              <span className="message-role">System</span>
              <div className="message-content" style={{ opacity: 0.7 }}>
                <Clock size={16} style={{display:'inline', marginRight:'5px'}}/> 
                {lobbyConfig.mode === 'multi' ? 'Waiting for other players to submit actions...' : 'Game Master is resolving your action...'}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area" style={{ position: 'relative' }}>
          
          {/* Floating Plus Menu */}
          {plusMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '15%', marginBottom: '20px', 
              background: 'rgba(10, 10, 15, 0.98)', border: '1px solid var(--accent-cyan)',
              borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px',
              boxShadow: '0 0 40px rgba(0,240,255,0.2)', zIndex: 100, width: '320px', maxHeight: '500px', overflowY: 'auto'
            }}>
              <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => { setHudOpen(true); setPlusMenuOpen(false); }}>
                <User size={18}/> Character Details
              </button>
              
              <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={() => { setAnimeImageGenEnabled(!animeImageGenEnabled); setPlusMenuOpen(false); }}>
                <ImageIcon size={18}/> {animeImageGenEnabled ? 'Disable Anime Gen' : 'Enable Anime Gen'}
              </button>
              
              <button className="menu-btn" style={{ position: 'relative', top: 0, left: 0, width: '100%', justifyContent: 'flex-start', border: 'none', padding: '12px' }} onClick={cycleAura}>
                <Zap size={18} color={auraState === 'Release' ? 'red' : auraState === 'Hidden' ? 'gray' : 'cyan'}/> Aura: {auraState}
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

              {/* Action Menu button added below input */}
            </div>
          )}

          {actionMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: '0%', marginBottom: '20px', 
              background: 'rgba(10, 10, 15, 0.98)', border: '1px solid var(--accent-cyan)',
              borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px',
              boxShadow: '0 0 40px rgba(0,240,255,0.2)', zIndex: 100, width: '400px', maxHeight: '500px', overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>Action Hub</h3>
                <button onClick={() => setActionMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>X</button>
              </div>
              <hr style={{ borderColor: 'var(--glass-border)', margin: '0' }} />

              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '5px', textTransform: 'uppercase' }}>Quick Actions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Look around', 'Equip weapon', 'Hands behind back', 'Look nonchalant', 'Look surprised', 'Smile wickedly', 'Stay silent', 'Nod slowly', 'Frown', 'Examine item', 'Attack', 'Defend'].map(act => (
                  <button key={act} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' }}
                    onClick={() => {
                      setInputValue(prev => prev ? `${prev} *${act.toLowerCase()}*` : `*${act.toLowerCase()}*`);
                      setActionMenuOpen(false);
                    }}
                    onMouseOver={e => e.target.style.borderColor = 'var(--accent-cyan)'}
                    onMouseOut={e => e.target.style.borderColor = 'var(--glass-border)'}
                  >{act}</button>
                ))}
              </div>

              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '5px', marginTop: '10px', textTransform: 'uppercase' }}>Abilities Quick-Cast</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills?.map(skill => (
                  <button key={skill} style={{ background: 'rgba(255,0,85,0.05)', border: '1px solid var(--accent-magenta)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' }}
                    onClick={() => {
                      setInputValue(prev => prev ? `${prev} *casts ${skill}*` : `*casts ${skill}*`);
                      setActionMenuOpen(false);
                    }}
                    onMouseOver={e => e.target.style.background = 'rgba(255,0,85,0.2)'}
                    onMouseOut={e => e.target.style.background = 'rgba(255,0,85,0.05)'}
                  >{skill}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
            <button className="send-btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '0 20px', borderRadius: '12px' }} onClick={() => { setPlusMenuOpen(!plusMenuOpen); setActionMenuOpen(false); }}>
              <Plus size={24} color="var(--accent-cyan)" />
            </button>
            <button className="send-btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--accent-magenta)', padding: '0 20px', borderRadius: '12px', color: 'var(--accent-magenta)', fontWeight: 'bold' }} onClick={() => { setActionMenuOpen(!actionMenuOpen); setPlusMenuOpen(false); }}>
              ACTIONS
            </button>
            
            <input 
              type="text" 
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isWaiting ? "Waiting for resolution..." : "Declare your action..."}
              disabled={isWaiting}
              onClick={() => { setPlusMenuOpen(false); setActionMenuOpen(false); }}
              style={{ flex: 1, borderRadius: '12px' }}
            />
            <button className="send-btn" onClick={handleSend} disabled={!inputValue.trim() || isWaiting} style={{ borderRadius: '12px' }}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatEngine;
