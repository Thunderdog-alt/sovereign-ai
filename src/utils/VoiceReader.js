let isMuted = false;

export const toggleMuteVoice = () => {
  isMuted = !isMuted;
  if (isMuted) window.speechSynthesis.cancel();
  return isMuted;
};

export const getIsMuted = () => isMuted;

// Returns available voices on the system
const getVoices = () => {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) resolve(voices);
    else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
};

export const speakMessage = async (text) => {
  if (isMuted) return;
  if (!window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const voices = await getVoices();
  
  // Try to find a deep voice for narrator, and a standard one for characters
  const narratorVoice = voices.find(v => v.name.includes('Google UK English Male') || v.name.includes('David') || v.name.includes('Male')) || voices[0];
  const charVoice = voices.find(v => v.name.includes('Google UK English Female') || v.name.includes('Zira') || v.name.includes('Female')) || voices[1] || voices[0];

  // Regex to split text into array of objects: { type: 'narrator' | 'dialogue', text: '...' }
  // Matches text inside double quotes, treating it as dialogue
  const parts = [];
  let currentIdx = 0;
  const quoteRegex = /"([^"]*)"/g;
  let match;

  while ((match = quoteRegex.exec(text)) !== null) {
    // Text before the quote is narrator
    if (match.index > currentIdx) {
      parts.push({ type: 'narrator', text: text.substring(currentIdx, match.index) });
    }
    // The quote itself
    parts.push({ type: 'dialogue', text: match[1] });
    currentIdx = quoteRegex.lastIndex;
  }
  
  // Remaining text
  if (currentIdx < text.length) {
    parts.push({ type: 'narrator', text: text.substring(currentIdx) });
  }

  // Fallback if no quotes
  if (parts.length === 0) {
    parts.push({ type: 'narrator', text });
  }

  // Queue up utterances sequentially
  const speakPart = (index) => {
    if (isMuted || index >= parts.length) return;
    
    const part = parts[index];
    if (!part.text.trim()) {
      speakPart(index + 1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(part.text);
    utterance.voice = part.type === 'dialogue' ? charVoice : narratorVoice;
    
    // Adjust pitch/rate slightly for character vs narrator
    if (part.type === 'dialogue') {
      utterance.pitch = 1.2;
      utterance.rate = 1.05;
    } else {
      utterance.pitch = 0.9;
      utterance.rate = 0.95;
    }

    utterance.onend = () => {
      speakPart(index + 1);
    };

    utterance.onerror = () => {
      speakPart(index + 1); // Skip on error
    };

    window.speechSynthesis.speak(utterance);
  };

  speakPart(0);
};
