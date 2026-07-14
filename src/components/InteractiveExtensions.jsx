import React, { useState } from 'react';
import { useGameState } from '../context/gameStateContext';

const SKILL_GATCHA_RATES = [
  { rank: "F", name: "[Minor Pain Resistance (10% Reduction)]", cost: 10, prob: 0.50 },
  { rank: "E", name: "[Heavy Strike (STR x1.5)]", cost: 25, prob: 0.30 },
  { rank: "D", name: "[Iron Skin (Duration: 3 turns)]", cost: 50, prob: 0.12 },
  { rank: "C", name: "[Lightning Dash (AGI x2 for 1 turn)]", cost: 100, prob: 0.05 },
  { rank: "B", name: "[Gravity Crush (5m radius AOE)]", cost: 500, prob: 0.02 },
  { rank: "A", name: "[Meteor Summon (Requires 50 MP)]", cost: 1000, prob: 0.008 },
  { rank: "S", name: "[Domain of Frost (Freezes enemies for 2 turns)]", cost: 10000, prob: 0.0019 },
  { rank: "EX", name: "[Sovereign's Authority (Absolute Command x1/day)]", cost: 100000, prob: 0.0001 }
];

const InteractiveExtensions = () => {
  const { coins, setCoins, companions, level, skills, setSkills } = useGameState();
  const [selectedCompanion, setSelectedCompanion] = useState(null);

  const getMaxSlots = () => {
    if (level >= 30) return 5;
    if (level >= 20) return 4;
    if (level >= 10) return 3;
    return 2;
  };

  const handleAddSkill = () => {
    const maxSlots = getMaxSlots();
    if (skills.length >= maxSlots) {
      alert(`Skill slots full! Reach Level ${maxSlots === 2 ? 10 : maxSlots === 3 ? 20 : 30} to unlock more slots.`);
      return;
    }

    if (coins < 10) {
      alert("Not enough Sovereign Coins to pull a skill! (Need 10)");
      return;
    }
    setCoins(coins - 10);
    
    const roll = Math.random();
    let cumulative = 0;
    let selectedSkill = SKILL_GATCHA_RATES[0];
    
    for (let item of SKILL_GATCHA_RATES) {
      cumulative += item.prob;
      if (roll <= cumulative) {
        selectedSkill = item;
        break;
      }
    }
    
    const formattedSkill = `[${selectedSkill.rank}] ${selectedSkill.name.replace(/[\[\]]/g, '')}`;
    if (!skills.includes(formattedSkill)) {
      setSkills([...skills, formattedSkill]);
    } else {
        alert(`Duplicate Skill Pulled: ${formattedSkill}. Converted to EXP shards.`);
    }
  };

  return (
    <div className="interactive-extensions">
      <div className="roster-menu">
        <label>Companions Encountered: </label>
        {companions && companions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
            {companions.map((comp, idx) => (
              <button 
                key={idx} 
                className="mode-btn" 
                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                onClick={() => setSelectedCompanion(comp)}
              >
                {comp.name}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No companions encountered yet.</p>
        )}
      </div>

      {selectedCompanion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            <button 
              onClick={() => setSelectedCompanion(null)} 
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              X
            </button>
            <h3 style={{ color: 'var(--accent-cyan)', textAlign: 'center' }}>{selectedCompanion.name}</h3>
            <div style={{ width: '100%', height: '300px', background: 'var(--bg-panel)', borderRadius: '8px', overflow: 'hidden' }}>
              <img 
                src={`https://image.pollinations.ai/prompt/${encodeURIComponent(`anime manga style high quality character portrait of ${selectedCompanion.name}, ${selectedCompanion.description || 'fantasy character'}`)}?width=400&height=300&nologo=true`} 
                alt={selectedCompanion.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
              {selectedCompanion.description || "A mysterious figure encountered on your journey."}
            </p>
          </div>
        </div>
      )}
      
      <div className="skills-deck" style={{ marginTop: '1rem' }}>
        <label>Skills Deck (Max Slots: {getMaxSlots()})</label>
        <div className="skills-list">
          {skills.map((skill, i) => (
            <div key={i} className="skill-slot" title={skill}>{skill}</div>
          ))}
          {skills.length < getMaxSlots() && (
            <button className="add-skill-btn" onClick={handleAddSkill}>+</button>
          )}
          {skills.length === getMaxSlots() && getMaxSlots() < 5 && (
            <div className="skill-slot locked" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', padding: '10px' }} title="Reach higher level to unlock">
              Reach Lvl {getMaxSlots() === 2 ? 10 : getMaxSlots() === 3 ? 20 : 30} to unlock
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InteractiveExtensions;
