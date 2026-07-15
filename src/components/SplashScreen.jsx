import React, { useState, useEffect } from 'react';
import { unlockAudio } from '../utils/AudioManager';

const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState('click_to_enter'); // click_to_enter -> initial -> typing -> glow -> fade
  const [clicked, setClicked] = useState(false);

  const handleEnter = () => {
    if (clicked) return;
    setClicked(true);
    unlockAudio(); // Unlock browser audio on first interaction

    setStage('initial');
    const t1 = setTimeout(() => setStage('typing'), 500);
    const t2 = setTimeout(() => setStage('glow'), 2000);
    const t3 = setTimeout(() => setStage('fade'), 3500);
    const t4 = setTimeout(() => onComplete(), 4500);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  };

  if (stage === 'click_to_enter') {
    return (
      <div
        onClick={handleEnter}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#050505', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999, cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <h1 style={{
          fontFamily: "'Orbitron', 'Inter', sans-serif", fontSize: '5rem', letterSpacing: '20px',
          WebkitTextStroke: '1px rgba(0, 240, 255, 0.5)', color: 'transparent',
          textShadow: '0 0 40px rgba(0, 240, 255, 0.2)', animation: 'pulse 2s ease-in-out infinite',
          marginBottom: '3rem'
        }}>
          SOVEREIGN
        </h1>
        <div style={{
          border: '1px solid rgba(0, 240, 255, 0.4)', color: 'var(--accent-cyan)',
          padding: '15px 40px', borderRadius: '4px', letterSpacing: '6px',
          fontSize: '1rem', animation: 'blink 1.5s step-end infinite',
          textTransform: 'uppercase'
        }}>
          ▶ Click to Enter Reality
        </div>
        <p style={{ position: 'absolute', bottom: '5%', color: 'rgba(255,255,255,0.2)', letterSpacing: '4px', fontSize: '0.7rem' }}>
          A N O M A L Y   S T U D I O S
        </p>
        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#050505', display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 9999, transition: 'opacity 1s ease-in-out',
        opacity: stage === 'fade' ? 0 : 1,
        pointerEvents: stage === 'fade' ? 'none' : 'all'
      }}
    >
      <h1
        style={{
          fontFamily: "'Orbitron', 'Inter', sans-serif",
          fontSize: '4rem',
          letterSpacing: stage === 'initial' ? '10px' : '20px',
          color: stage === 'glow' ? '#fff' : 'transparent',
          WebkitTextStroke: stage === 'glow' ? 'none' : '1px rgba(255,255,255,0.3)',
          textShadow: stage === 'glow' ? '0 0 20px rgba(0, 255, 255, 0.8), 0 0 40px rgba(0, 255, 255, 0.4)' : 'none',
          transition: 'all 1.5s cubic-bezier(0.25, 1, 0.5, 1)',
          transform: stage === 'glow' ? 'scale(1.1)' : 'scale(1)',
          opacity: stage === 'initial' ? 0 : 1
        }}
      >
        SOVEREIGN
      </h1>
      <p
        style={{
          position: 'absolute', bottom: '20%',
          fontFamily: "'Inter', sans-serif", letterSpacing: '5px', fontSize: '0.9rem',
          color: 'var(--accent-cyan)', opacity: stage === 'glow' ? 0.7 : 0,
          transition: 'opacity 1s ease-in-out'
        }}
      >
        A N O M A L Y   S T U D I O S
      </p>
    </div>
  );
};

export default SplashScreen;
