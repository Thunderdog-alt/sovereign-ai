import React, { createContext, useContext, useState, useEffect } from 'react';

const GameStateContext = createContext();

export const useGameState = () => useContext(GameStateContext);

const loadState = (key, defaultVal) => {
  const saved = localStorage.getItem(`sov_${key}`);
  return saved ? JSON.parse(saved) : defaultVal;
};

export const GameStateProvider = ({ children }) => {
  const [world, setWorld] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem('sov_username') || '');
  const [characterName, setCharacterName] = useState(loadState('characterName', ''));
  const [characterDescription, setCharacterDescription] = useState(loadState('characterDescription', ''));
  const [systemType, setSystemType] = useState('None');
  const [gameMode, setGameMode] = useState('Start from Scratch');
  const [avatarImage, setAvatarImage] = useState(null);
  const [auraState, setAuraState] = useState('Normal'); 
  
  const [level, setLevel] = useState(loadState('level', 1));
  const [xp, setXp] = useState(loadState('xp', 0));
  const [coins, setCoins] = useState(loadState('coins', 0));
  
  const [hp, setHp] = useState(loadState('hp', 100));
  const [maxHp, setMaxHp] = useState(loadState('maxHp', 100));
  
  const [mp, setMp] = useState(loadState('mp', 50));
  const [maxMp, setMaxMp] = useState(loadState('maxMp', 50));
  
  const [stats, setStats] = useState(loadState('stats', {
    STR: 10, AGI: 10, STA: 10, INT: 10, LUK: 10, Unassigned: 10
  }));

  const [systemData, setSystemData] = useState(loadState('systemData', {
    gachaPity: 0, combatMandates: 0, mercBattalionStatus: "Idle", slackerComfort: 100, signInTerritories: 0
  }));

  const [companions, setCompanions] = useState(loadState('companions', []));
  const [skills, setSkills] = useState(loadState('skills', ["[F] Slash (Base)", "[E] Heal (Base)"]));
  const [customWorlds, setCustomWorlds] = useState(loadState('customWorlds', []));

  useEffect(() => {
    localStorage.setItem('sov_level', JSON.stringify(level));
    localStorage.setItem('sov_xp', JSON.stringify(xp));
    localStorage.setItem('sov_coins', JSON.stringify(coins));
    localStorage.setItem('sov_hp', JSON.stringify(hp));
    localStorage.setItem('sov_maxHp', JSON.stringify(maxHp));
    localStorage.setItem('sov_mp', JSON.stringify(mp));
    localStorage.setItem('sov_maxMp', JSON.stringify(maxMp));
    localStorage.setItem('sov_stats', JSON.stringify(stats));
    localStorage.setItem('sov_systemData', JSON.stringify(systemData));
    localStorage.setItem('sov_companions', JSON.stringify(companions));
    localStorage.setItem('sov_skills', JSON.stringify(skills));
    localStorage.setItem('sov_customWorlds', JSON.stringify(customWorlds));
    localStorage.setItem('sov_characterName', JSON.stringify(characterName));
    localStorage.setItem('sov_characterDescription', JSON.stringify(characterDescription));
  }, [level, xp, coins, hp, maxHp, mp, maxMp, stats, systemData, companions, skills, customWorlds, characterName, characterDescription]);

  const parseRewardTags = (text) => {
    const expMatch = text.match(/<EXP:\+?(\d+)>/);
    const coinMatch = text.match(/<COIN:\+?(\d+)>/);
    const hpMatch = text.match(/<HP:-(\d+)>/);
    const mpMatch = text.match(/<MP:-(\d+)>/);
    
    let cleanText = text;
    let newXp = xp, newCoins = coins, newHp = hp, newMp = mp;

    if (expMatch) { newXp += parseInt(expMatch[1], 10); cleanText = cleanText.replace(/<EXP:\+?\d+>/g, ''); }
    if (coinMatch) { newCoins += parseInt(coinMatch[1], 10); cleanText = cleanText.replace(/<COIN:\+?\d+>/g, ''); }
    if (hpMatch) { newHp = Math.max(0, newHp - parseInt(hpMatch[1], 10)); cleanText = cleanText.replace(/<HP:-\d+>/g, ''); }
    if (mpMatch) { newMp = Math.max(0, newMp - parseInt(mpMatch[1], 10)); cleanText = cleanText.replace(/<MP:-\d+>/g, ''); }

    if (newXp !== xp) handleXpGain(newXp);
    if (newCoins !== coins) setCoins(newCoins);
    if (newHp !== hp) setHp(newHp);
    if (newMp !== mp) setMp(newMp);

    return cleanText.trim();
  };

  const handleXpGain = (currentXp) => {
    let xpNeeded = 100 * level;
    if (currentXp >= xpNeeded) {
      setLevel(l => l + 1);
      setXp(currentXp - xpNeeded);
      setStats(s => ({ ...s, Unassigned: s.Unassigned + 2 }));
      setMaxHp(m => m + 10);
      setHp(maxHp + 10);
      setMaxMp(m => m + 5);
      setMp(maxMp + 5);
    } else {
      setXp(currentXp);
    }
  };

  const updateSystemData = (updates) => {
    setSystemData(prev => ({ ...prev, ...updates }));
  };

  return (
    <GameStateContext.Provider value={{
      username, setUsername,
      characterName, setCharacterName,
      characterDescription, setCharacterDescription,
      world, setWorld, systemType, setSystemType, auraState, setAuraState,
      gameMode, setGameMode, avatarImage, setAvatarImage, companions, setCompanions,
      level, xp, coins, setCoins, hp, maxHp, mp, maxMp,
      stats, setStats, systemData, updateSystemData, parseRewardTags,
      skills, setSkills, customWorlds, setCustomWorlds
    }}>
      {children}
    </GameStateContext.Provider>
  );
};
