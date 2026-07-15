import React, { useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import ChatMessage from './ChatMessage';
import SystemHUD from './SystemHUD';
import TutorialOverlay from './TutorialOverlay';
import ChatPlusMenu from './ChatPlusMenu';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatActionMenu from './ChatActionMenu';
import { useGameState } from '../context/gameStateContext';
import { User, Image as ImageIcon, Send, Clock, Plus, Zap, Star, MessageSquare, VolumeX, Volume2, Mic, MicOff } from 'lucide-react';
import { socket } from '../socket';
import { playSound, crossfadeBgm, startVoidLoop, stopVoidLoop } from '../utils/AudioManager';
import { speakMessage, toggleMuteVoice, getIsMuted } from '../utils/VoiceReader';

const ChatEngine = ({ onExit, lobbyConfig }) => {
  const { world, systemType, setSystemType, auraState, setAuraState, parseRewardTags, username, characterName, skills } = useGameState();
  
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
    
    // Start ambient void sound
    startVoidLoop();

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
      let cleanText = parseRewardTags(resolution);
      
      // Parse Mood Tag
      const moodMatch = cleanText.match(/<MOOD:([A-Za-z]+)>/);
      if (moodMatch) {
        const mood = moodMatch[1];
        crossfadeBgm(mood);
        cleanText = cleanText.replace(moodMatch[0], '').trim();
      } else {
        crossfadeBgm('Neutral');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: cleanText, sender: 'Game Master' }]);
      scrollToBottom();
      speakMessage(cleanText);

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

    return () => {
      stopVoidLoop();
      socket.disconnect();
    };
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
    
    playSound('click', 0.5);

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
      const newTime = Math.ceil(rem);
      setTimeLeft(newTime);
      // Play tick sound when <= 10 seconds
      if (newTime <= 10 && newTime > 0) {
        playSound('timer', 0.4);
      }
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

      <button 
        onClick={() => setHudOpen(true)}
        style={{
          position: 'fixed', right: '20px', top: '50%', transform: 'translateY(-50%)',
          background: 'rgba(10, 10, 15, 0.9)', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)',
          padding: '15px 10px', borderRadius: '12px 0 0 12px', zIndex: 50, cursor: 'pointer',
          boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
        }}
      >
        <span style={{ writingMode: 'vertical-rl', textOrientation: 'upright', fontWeight: 'bold', letterSpacing: '2px', fontSize: '1.2rem' }}>
          SYSTEM
        </span>
      </button>

      <div className="chat-panel">
        <ChatHeader 
          setHudOpen={setHudOpen}
          characterName={characterName}
          username={username}
          world={world}
          lobbyConfig={lobbyConfig}
          lobbyState={lobbyState}
          timeLeft={timeLeft}
          animeImageGenEnabled={animeImageGenEnabled}
          imageTokens={imageTokens}
          systemType={systemType}
        />

        <ChatHistory 
          messages={messages}
          isWaiting={isWaiting}
          lobbyConfig={lobbyConfig}
          setPlusMenuOpen={setPlusMenuOpen}
          messagesEndRef={messagesEndRef}
        />

        <div className="chat-input-area" style={{ position: 'relative' }}>
                   {/* Floating Plus Menu */}
          {plusMenuOpen && (
            <ChatPlusMenu 
              setHudOpen={setHudOpen}
              setPlusMenuOpen={setPlusMenuOpen}
              animeImageGenEnabled={animeImageGenEnabled}
              setAnimeImageGenEnabled={setAnimeImageGenEnabled}
              auraState={auraState}
              cycleAura={cycleAura}
              socket={socket}
              lobbyConfig={lobbyConfig}
              characterName={characterName}
              username={username}
              setIsWaiting={setIsWaiting}
            />
          )}

          {actionMenuOpen && (
            <ChatActionMenu 
              setActionMenuOpen={setActionMenuOpen}
              setInputValue={setInputValue}
              skills={skills}
            />
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
