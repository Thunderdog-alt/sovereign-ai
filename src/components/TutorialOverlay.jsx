import React, { useState } from 'react';

const TutorialOverlay = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-box glass-panel">
        {step === 1 && (
          <>
            <h3>Welcome to Sovereign AI</h3>
            <p>You have awakened your System. This interface directly manipulates reality via the Game Master.</p>
            <button className="connect-btn" onClick={() => setStep(2)}>Next</button>
          </>
        )}
        {step === 2 && (
          <>
            <h3>Sovereign Coins & Power</h3>
            <p>Sovereign Coins are your only lifeline. Earn them via System Mandates. Spend them in your Profile to pull Skills.</p>
            <button className="connect-btn" onClick={() => setStep(3)}>Next</button>
          </>
        )}
        {step === 3 && (
          <>
            <h3>Your Player Profile</h3>
            <p>Your stats, skills, and Aura settings are hidden in the "Player Profile" button on your world banner. Keep the chat clean, stay focused.</p>
            <button className="connect-btn" onClick={onComplete}>Initialize</button>
          </>
        )}
      </div>
    </div>
  );
};

export default TutorialOverlay;
