import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState('initial'); // initial -> typing -> glow -> fade

  useEffect(() => {
    // Stage sequence
    const t1 = setTimeout(() => setStage('typing'), 500);
    const t2 = setTimeout(() => setStage('glow'), 2000);
    const t3 = setTimeout(() => setStage('fade'), 3500);
    const t4 = setTimeout(() => onComplete(), 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

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
