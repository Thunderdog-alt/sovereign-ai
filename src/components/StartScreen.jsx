import React, { useState } from 'react';
import { useGameState } from '../context/gameStateContext';
import CreateWorldModal from './CreateWorldModal';
import { Zap } from 'lucide-react';

const PRE_MADE_WORLDS = [
  { name: "500 BCE Babylon", image: "https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=400&auto=format&fit=crop" },
  { name: "Cyber City 2099", image: "https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=400&auto=format&fit=crop" },
  { name: "Eldoria High Fantasy", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop" },
  { name: "Neo-Tokyo Underground", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&auto=format&fit=crop" },
];

const ANIME_TROPES = [
  "Jujutsu Sorcerer Tokyo", "Shinigami Soul Society", "Hidden Leaf Ninja Village",
  "Hero Academia UA City", "Demon Slayer Taisho Era", "Titan Walled City",
  "Alchemist State Military", "Hunter Exam Island", "Stand User Cairo", "Espada Hueco Mundo"
];

const StartScreen = ({ onWorldSelect }) => {
  const { setWorld, customWorlds, setCustomWorlds } = useGameState();
  const [showModal, setShowModal] = useState(false);
  const [isGeneratingAnime, setIsGeneratingAnime] = useState(false);

  const handleSelect = (worldName) => {
    setWorld(worldName);
    onWorldSelect(worldName);
  };

  const handleCreateWorld = (newWorld) => {
    setCustomWorlds([newWorld, ...customWorlds]);
    setShowModal(false);
  };

  const generateAnimeWorld = () => {
    setIsGeneratingAnime(true);
    const randomTrope = ANIME_TROPES[Math.floor(Math.random() * ANIME_TROPES.length)];
    const seed = Math.floor(Math.random() * 100000);
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`masterpiece anime 90s aesthetic beautiful cinematic scenery of ${randomTrope}`)}?width=400&height=250&nologo=true&seed=${seed}`;
    
    setTimeout(() => {
      const newAnimeWorld = {
        id: Date.now().toString(),
        name: randomTrope,
        lore: "Strictly adhere to the power system and rules of this anime world. No modern crossover unless specified.",
        image: imgUrl,
        isPublic: true
      };
      setCustomWorlds([newAnimeWorld, ...customWorlds]);
      setIsGeneratingAnime(false);
    }, 1000);
  };

  return (
    <div className="start-screen-container">
      {showModal && <CreateWorldModal onClose={() => setShowModal(false)} onCreate={handleCreateWorld} />}
      <header className="start-header">
        <h2>SOVEREIGN AI DASHBOARD</h2>
        <div className="hero-buttons">
          <button 
            className="hero-btn pure-life-btn" 
            onClick={() => handleSelect("Pure Life Roleplay")}
          >
            <span className="hero-btn-title">PURE LIFE ROLEPLAY</span>
            <span className="hero-btn-subtitle">Enter a grounded, realistic simulation without powers.</span>
          </button>
          <div className="secondary-hero-buttons">
            <button 
              className="hero-btn multiplayer-btn"
              onClick={() => handleSelect("Multiplayer Hub")}
            >
              MULTIPLAYER HUB
            </button>
            <button 
              className="hero-btn create-world-btn"
              onClick={() => setShowModal(true)}
            >
              CREATE NEW REALITY
            </button>
            <button 
              className="hero-btn anime-gen-btn"
              onClick={generateAnimeWorld}
              disabled={isGeneratingAnime}
              style={{ background: 'linear-gradient(45deg, #ff0055, #a200ff)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
            >
              {isGeneratingAnime ? <Zap className="spin" size={18} /> : <Zap size={18} />}
              {isGeneratingAnime ? "SYNTHESIZING..." : "GENERATE ANIME WORLD"}
            </button>
          </div>
        </div>
      </header>

      <section className="worlds-section custom-worlds-section" style={{ marginTop: '3rem' }}>
        <h3 className="section-title">Your Custom Realities</h3>
        {customWorlds.length === 0 ? (
          <p className="empty-state">No custom worlds created yet. Click 'Create New Reality' above.</p>
        ) : (
          <div className="worlds-grid">
            {customWorlds.map((w) => (
              <div 
                key={w.id} 
                className="world-card" 
                onClick={() => handleSelect(w.name)}
                style={{ backgroundImage: `url('${w.image}')` }}
              >
                <div className="world-card-overlay"></div>
                <div className="world-card-content">
                  <h4>{w.name}</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{w.isPublic ? 'Public' : 'Private'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="worlds-section" style={{ marginTop: '2rem' }}>
        <h3 className="section-title">Pre-Made Realities (25)</h3>
        <div className="worlds-grid">
          {PRE_MADE_WORLDS.map((w, idx) => (
            <div 
              key={idx} 
              className="world-card" 
              onClick={() => handleSelect(w.name)}
              style={{ backgroundImage: `url('${w.image}')` }}
            >
              <div className="world-card-overlay"></div>
              <div className="world-card-content">
                <h4>{w.name}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StartScreen;
