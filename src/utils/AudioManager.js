const audioElements = {};
let currentBgm = null;
let bgmVolume = 0.5;

export const playSound = (name, volume = 0.8) => {
  if (!audioElements[name]) {
    audioElements[name] = new Audio(`/audio/${name}.mp3`);
  }
  const audio = audioElements[name];
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play().catch(e => console.log('Audio play failed:', e));
};

export const startVoidLoop = () => {
  if (!audioElements['void']) {
    audioElements['void'] = new Audio('/audio/void.mp3');
    audioElements['void'].loop = true;
    audioElements['void'].volume = 0.3;
  }
  audioElements['void'].play().catch(e => {});
};

export const stopVoidLoop = () => {
  if (audioElements['void']) {
    audioElements['void'].pause();
    audioElements['void'].currentTime = 0;
  }
};

export const crossfadeBgm = (mood) => {
  const newBgmPath = `/audio/${mood}.mp3`;
  
  if (currentBgm && currentBgm.src.includes(mood)) return; // Already playing

  const newAudio = new Audio(newBgmPath);
  newAudio.loop = true;
  newAudio.volume = 0;
  newAudio.play().catch(e => console.log('BGM play failed:', e));

  const oldBgm = currentBgm;
  currentBgm = newAudio;

  // Crossfade
  let fadeStep = 0;
  const fadeInterval = setInterval(() => {
    fadeStep += 0.05;
    
    if (oldBgm) {
      oldBgm.volume = Math.max(0, bgmVolume - (bgmVolume * fadeStep));
    }
    newAudio.volume = Math.min(bgmVolume, bgmVolume * fadeStep);
    
    if (fadeStep >= 1) {
      clearInterval(fadeInterval);
      if (oldBgm) {
        oldBgm.pause();
        oldBgm.currentTime = 0;
      }
    }
  }, 100);
};

export const setBgmVolume = (vol) => {
  bgmVolume = vol;
  if (currentBgm) {
    currentBgm.volume = vol;
  }
};
