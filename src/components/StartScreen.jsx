import React, { useState } from 'react';
import { useGameState } from '../context/gameStateContext';

const PRE_MADE_WORLDS = [
  { name: "500 BCE Babylon", image: "https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=400&auto=format&fit=crop" },
  { name: "Cyber City 2099", image: "https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=400&auto=format&fit=crop" },
  { name: "Eldoria High Fantasy", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop" },
  { name: "Neo-Tokyo Underground", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=400&auto=format&fit=crop" },
  { name: "Steampunk London 1888", image: "https://images.unsplash.com/photo-1473654729291-f865f3f0f707?q=80&w=400&auto=format&fit=crop" },
  { name: "Mars Colony Alpha", image: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=400&auto=format&fit=crop" },
  { name: "Post-Apocalyptic Earth", image: "https://images.unsplash.com/photo-1519810755548-39cd217da494?q=80&w=400&auto=format&fit=crop" },
  { name: "Vampire Courts", image: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=400&auto=format&fit=crop" },
  { name: "Space Pirate Armada", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400&auto=format&fit=crop" },
  { name: "Feudal Japan 1500s", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=400&auto=format&fit=crop" },
  { name: "Atlantis Deep Station", image: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?q=80&w=400&auto=format&fit=crop" },
  { name: "Wasteland Mutants", image: "https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?q=80&w=400&auto=format&fit=crop" },
  { name: "Arcane Magic Academy", image: "https://images.unsplash.com/photo-1515091943-9d5c0ad200d7?q=80&w=400&auto=format&fit=crop" },
  { name: "Mecha Defense Force", image: "https://images.unsplash.com/photo-1533596664505-df1a3014a415?q=80&w=400&auto=format&fit=crop" },
  { name: "Victorian Horror", image: "https://images.unsplash.com/photo-1508204856083-d95e00315c25?q=80&w=400&auto=format&fit=crop" },
  { name: "Wild West Frontier", image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=400&auto=format&fit=crop" },
  { name: "Galactic Empire Capital", image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400&auto=format&fit=crop" },
  { name: "Zombie Survival", image: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400&auto=format&fit=crop" },
  { name: "Greek Mythology Age", image: "https://images.unsplash.com/photo-1533729517316-240212da970d?q=80&w=400&auto=format&fit=crop" },
  { name: "Lovecraftian Port", image: "https://images.unsplash.com/photo-1499540633125-484965b60031?q=80&w=400&auto=format&fit=crop" },
  { name: "Dystopian Mega-Corp", image: "https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=400&auto=format&fit=crop" },
  { name: "Superhero Academy", image: "https://images.unsplash.com/photo-1555580168-9de136e0d9b4?q=80&w=400&auto=format&fit=crop" },
  { name: "Ancient Egypt Gods", image: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?q=80&w=400&auto=format&fit=crop" },
  { name: "Viking Raid Era", image: "https://images.unsplash.com/photo-1579768600127-4f603cba26ba?q=80&w=400&auto=format&fit=crop" },
  { name: "Fairy Tale Dark Woods", image: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=400&auto=format&fit=crop" }
];

import CreateWorldModal from './CreateWorldModal';

const StartScreen = ({ onWorldSelect }) => {
  const { setWorld, customWorlds, setCustomWorlds } = useGameState();
  const [showModal, setShowModal] = useState(false);

  const handleSelect = (worldName) => {
    setWorld(worldName);
    onWorldSelect(worldName);
  };

  const handleCreateWorld = (newWorld) => {
    setCustomWorlds([...customWorlds, newWorld]);
    setShowModal(false);
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
