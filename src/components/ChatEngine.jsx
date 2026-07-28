import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import SystemHUD from './SystemHUD';
import TutorialOverlay from './TutorialOverlay';
import ChatPlusMenu from './ChatPlusMenu';
import ChatHeader from './ChatHeader';
import ChatHistory from './ChatHistory';
import ChatActionMenu from './ChatActionMenu';
import { useGameState } from '../context/gameStateContext';
import { Plus, Send } from 'lucide-react';
import { playSound, crossfadeBgm, startVoidLoop, stopVoidLoop } from '../utils/AudioManager';
import { speakMessage } from '../utils/VoiceReader';
import { callGemini } from '../utils/geminiClient';
import { getMessages, addMessage, getVault, getLobbyState, saveLobbyState } from '../utils/memoryManager';

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
  
  const activeUser = characterName || username;

  useEffect(() => {
    startVoidLoop();
    
    // Load local state
    const storedState = getLobbyState(lobbyConfig.lobbyId);
    const initialState = storedState || {
      id: lobbyConfig.lobbyId,
      host: activeUser,
      world,
      timeLimit: lobbyConfig.timeLimit || 0,
      systemType: lobbyConfig.systemType || 'None',
      gameMode: lobbyConfig.gameMode || 'Start from Scratch',
      turnStartTime: Date.now()
    };
    
    if (!storedState) {
      saveLobbyState(lobbyConfig.lobbyId, initialState);
    }
    
    setLobbyState(initialState);
    
    // Load local messages
    const localMsgs = getMessages(lobbyConfig.lobbyId);
    setMessages(localMsgs);

    return () => {
      stopVoidLoop();
    };
  }, [lobbyConfig, activeUser, world]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isWaiting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const completeTutorial = () => {
    localStorage.setItem('sov_tutorial_done', 'true');
    setShowTutorial(false);
  };

  const processAIResponse = async (actionText) => {
    try {
      const vaultData = getVault(lobbyConfig.lobbyId);
      let memorySection = '';
      if (vaultData.archive && vaultData.archive.length > 0) {
        const archiveSnippet = vaultData.archive.length > 3000
          ? '...[ earlier history truncated ]...\n' + vaultData.archive.slice(-3000)
          : vaultData.archive;
        memorySection = `\n\n[MEMORY VAULT — archived messages from earlier in the story. Use this for continuity]:\n${archiveSnippet}`;
      }

      const prompt = `[System Instructions]: The world is ${world}. You are the Game Master.
Game Mode: ${lobbyState.gameMode}.
If the mode is 'God Mode', the player has absolute control over the narrative; you must bend reality to their will.
If the mode is 'Start from Scratch', the player is grounded, vulnerable, and must struggle; actions can fail, injuries happen, and you must strictly enforce logical consequences.
The player has the following System: ${systemType}.${memorySection}

IMPORTANT RULES (ABSOLUTE):
1. ABSOLUTE ZERO GOD-MODING: You are completely FORBIDDEN from writing dialogue, thoughts, movements, choices, or emotional responses for the player character.
2. AUTOMATIC PAUSE: Stop writing sentences immediately after your immediate environment or NPCs react.
3. SHADOW INTERNAL MONOLOGUES: NPCs alone possess internal thought paths. Format these strictly inside *italics*.
4. INDEPENDENT DYNAMIC UNIVERSE: The setting persists dynamically.
5. NO STRUCTURAL PROMPTING: Never break immersion by adding conversational tags like "What do you do next?".
6. COMPACT TEXT FLOW: Write a minimum of 1 paragraph and maximum of 3 paragraphs per interaction turn.
7. DYNAMIC REWARDS LOGIC: Append mechanical output tags at the end: <EXP:+X>, <GOLD:+X>, <HP:-X>, or <MP:-X>.
8. DYNAMIC MOOD TRACKING: Append EXACTLY ONE mood tag at the very end: <MOOD:Happy>, <MOOD:Sad>, <MOOD:Boss>, <MOOD:Fight>, <MOOD:Romance>, <MOOD:Stealth>, <MOOD:Slick>, or <MOOD:Neutral>.
9. DEBUFF TRACKING: If the player suffers injuries or ailments, append: <DEBUFFS:Injury1,Injury2,...>.

[${activeUser}]: ${actionText}
Resolve this action.`;

      const responseText = await callGemini(prompt, messages);
      
      let cleanText = parseRewardTags(responseText);
      const moodMatch = cleanText.match(/<MOOD:([A-Za-z]+)>/);
      if (moodMatch) {
        const mood = moodMatch[1];
        crossfadeBgm(mood);
        cleanText = cleanText.replace(moodMatch[0], '').trim();
      } else {
        crossfadeBgm('Neutral');
      }

      const newMsgs = addMessage(lobbyConfig.lobbyId, { role: 'assistant', content: cleanText, sender: 'Game Master' });
      setMessages(newMsgs);
      speakMessage(cleanText);

      if (animeImageGenEnabled && imageTokens > 0) {
        setImageTokens(t => t - 1);
        const animePrompt = `90s anime aesthetic, dynamic action scene, high quality, cinematic: ${world} scene where character is ${actionText} resulting in: ${cleanText.substring(0, 100)}`;
        setCurrentWorldImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(animePrompt)}?width=1200&height=400&nologo=true&seed=${Math.random()}`);
      }
    } catch (e) {
      console.error(e);
      alert('AI connection failed: ' + e.message);
    } finally {
      setIsWaiting(false);
      setLobbyState(prev => {
        const updated = { ...prev, turnStartTime: Date.now() };
        saveLobbyState(lobbyConfig.lobbyId, updated);
        return updated;
      });
    }
  };

  const handleSend = () => {
    if (!inputValue.trim() || isWaiting) return;
    playSound('click', 0.5);

    let finalAction = inputValue;
    if (auraState === 'Release') {
      finalAction = `[AURA RELEASED - Full Power Displayed] ${finalAction}`;
    } else if (auraState === 'Hidden') {
      finalAction = `[AURA HIDDEN - Completely Concealed] ${finalAction}`;
    }

    const newMsgs = addMessage(lobbyConfig.lobbyId, { role: 'user', content: finalAction, sender: activeUser });
    setMessages(newMsgs);
    setInputValue('');
    setIsWaiting(true);
    
    processAIResponse(finalAction);
  };

  const cycleAura = () => {
    if (auraState === 'Normal') setAuraState('Release');
    else if (auraState === 'Release') setAuraState('Hidden');
    else setAuraState('Normal');
  };

  const handleAwaken = () => {
    const scenario = prompt("Describe how you awaken a system (e.g., 'I am struck by lightning'):");
    if (scenario) {
      setSystemType("Custom Awaken");
      setPlusMenuOpen(false);
      const action = `[SYSTEM AWAKENING INITIATED]: ${scenario}`;
      setMessages(addMessage(lobbyConfig.lobbyId, { role: 'user', content: action, sender: activeUser }));
      setIsWaiting(true);
      processAIResponse(action);
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
          <SystemHUD onExit={onExit} lobbyConfig={lobbyConfig} />
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
          {plusMenuOpen && (
            <ChatPlusMenu 
              setHudOpen={setHudOpen}
              setPlusMenuOpen={setPlusMenuOpen}
              animeImageGenEnabled={animeImageGenEnabled}
              setAnimeImageGenEnabled={setAnimeImageGenEnabled}
              auraState={auraState}
              cycleAura={cycleAura}
              socket={{ emit: () => {} }} // Dummy object since we removed socket
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
