import React, { useState, useMemo } from 'react';
import { useGameState } from '../context/gameStateContext';
import CreateWorldModal from './CreateWorldModal';
import { Zap, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import MASSIVE_WORLDS from '../data/worlds.json';

const ANIME_TROPES = [
  "Jujutsu Sorcerer Tokyo", "Shinigami Soul Society", "Hidden Leaf Ninja Village",
  "Hero Academia UA City", "Demon Slayer Taisho Era", "Titan Walled City",
  "Alchemist State Military", "Hunter Exam Island", "Stand User Cairo", "Espada Hueco Mundo"
];

const StartScreen = ({ onWorldSelect }) => {
  const { setWorld, customWorlds, setCustomWorlds } = useGameState();
  const [showModal, setShowModal] = useState(false);
  const [isGeneratingAnime, setIsGeneratingAnime] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const ITEMS_PER_PAGE = 50;

  const filteredWorlds = useMemo(() => {
    if (!searchTerm) return MASSIVE_WORLDS;
    const lowerSearch = searchTerm.toLowerCase();
    return MASSIVE_WORLDS.filter(w => 
      w.title.toLowerCase().includes(lowerSearch) || 
      w.genre.toLowerCase().includes(lowerSearch) ||
      w.lore?.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  const currentWorlds = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWorlds.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, filteredWorlds]);

  const totalPages = Math.ceil(filteredWorlds.length / ITEMS_PER_PAGE) || 1;

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`masterpiece anime 90s aesthetic character portrait of ${randomTrope}`)}?width=400&height=500&nologo=true&seed=${seed}`;
    
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
              CREATE NEW PERSONA
            </button>
            <button 
              className="hero-btn anime-gen-btn"
              onClick={generateAnimeWorld}
              disabled={isGeneratingAnime}
              style={{ background: 'linear-gradient(45deg, #ff0055, #a200ff)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}
            >
              {isGeneratingAnime ? <Zap className="spin" size={18} /> : <Zap size={18} />}
              {isGeneratingAnime ? "SYNTHESIZING..." : "GENERATE ANIME PERSONA"}
            </button>
          </div>
        </div>
      </header>

      <section className="worlds-section custom-worlds-section" style={{ marginTop: '3rem' }}>
        <h3 className="section-title">Your Custom Personas</h3>
        {customWorlds.length === 0 ? (
          <p className="empty-state">No custom personas created yet. Click 'Create New Persona' above.</p>
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
                  {w.lore && <p style={{ fontSize: '0.8rem', color: '#ccc', marginTop: '5px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{w.lore}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="worlds-section" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <h3 className="section-title" style={{ margin: 0, border: 'none' }}>Characters & Personas ({filteredWorlds.length})</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search characters or tags..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '200px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '5px', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            ><ChevronLeft /></button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Page {currentPage} of {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '5px', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            ><ChevronRight /></button>
          </div>
        </div>
        
        {currentWorlds.length === 0 ? (
          <p className="empty-state">No personas match your search.</p>
        ) : (
          <div className="worlds-grid">
            {currentWorlds.map((w) => (
              <div 
                key={w.id} 
                className="world-card" 
                onClick={() => handleSelect(w.title)}
                style={{ backgroundImage: `url('${w.img}')` }}
              >
                <div className="world-card-overlay"></div>
                <div className="world-card-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4>{w.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{w.type} / {w.genre}</span>
                  <p style={{ fontSize: '0.8rem', color: '#ddd', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                    {w.lore || `Explore the depths of ${w.title}. A reality shaped by your decisions, survival, and choices.`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StartScreen;
