let audioContext = null;
const audioElements = {};
let currentBgm = null;
let bgmVolume = 0.4;
let audioUnlocked = false;

// Call this on first user interaction to unlock the browser's audio policy
export const unlockAudio = () => {
  if (audioUnlocked) return;
  audioUnlocked = true;
  
  // Create and immediately resume a silent AudioContext to satisfy browser policy
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  } catch (e) {}

  // Pre-warm the void ambient loop
  startVoidLoop();
};

export const isAudioUnlocked = () => audioUnlocked;

export const playSound = (name, volume = 0.8) => {
  if (!audioUnlocked) return;
  if (!audioElements[name]) {
    audioElements[name] = new Audio(`/audio/${name}.mp3`);
  }
  const audio = audioElements[name];
  audio.currentTime = 0;
  audio.volume = Math.min(1, volume);
  audio.play().catch(() => {});
};

export const startVoidLoop = () => {
  if (!audioElements['void']) {
    audioElements['void'] = new Audio('/audio/void.mp3');
    audioElements['void'].loop = true;
    audioElements['void'].volume = 0.2;
  }
  audioElements['void'].play().catch(() => {});
};

export const stopVoidLoop = () => {
  if (audioElements['void']) {
    audioElements['void'].pause();
    audioElements['void'].currentTime = 0;
  }
};

export const crossfadeBgm = (mood) => {
  if (!audioUnlocked) return;
  
  const moodMap = {
    'happy': 'Happy', 'sad': 'Sad', 'boss': 'Boss', 'fight': 'Fight',
    'romance': 'Romance', 'stealth': 'Stealth', 'slick': 'Slick',
    'Happy': 'Happy', 'Sad': 'Sad', 'Boss': 'Boss', 'Fight': 'Fight',
    'Romance': 'Romance', 'Stealth': 'Stealth', 'Slick': 'Slick'
  };
  
  const resolvedMood = moodMap[mood] || mood;
  const newBgmPath = `/audio/${resolvedMood}.mp3`;
  
  if (currentBgm && currentBgm._mood === resolvedMood) return; // Already playing

  const newAudio = new Audio(newBgmPath);
  newAudio.loop = true;
  newAudio.volume = 0;
  newAudio._mood = resolvedMood;
  newAudio.play().catch(() => {});

  const oldBgm = currentBgm;
  currentBgm = newAudio;

  let fadeStep = 0;
  const fadeInterval = setInterval(() => {
    fadeStep += 0.05;
    if (oldBgm) oldBgm.volume = Math.max(0, bgmVolume * (1 - fadeStep));
    newAudio.volume = Math.min(bgmVolume, bgmVolume * fadeStep);
    
    if (fadeStep >= 1) {
      clearInterval(fadeInterval);
      if (oldBgm) { oldBgm.pause(); oldBgm.currentTime = 0; }
    }
  }, 100);
};

export const stopBgm = () => {
  if (currentBgm) {
    currentBgm.pause();
    currentBgm.currentTime = 0;
    currentBgm = null;
  }
};

export const setBgmVolume = (vol) => {
  bgmVolume = vol;
  if (currentBgm) currentBgm.volume = vol;
};
