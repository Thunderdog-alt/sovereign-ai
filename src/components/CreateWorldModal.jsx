import React, { useState } from 'react';
import { useGameState } from '../context/gameStateContext';

const CreateWorldModal = ({ onClose, onCreate }) => {
  const [worldName, setWorldName] = useState('');
  const [lore, setLore] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!worldName) return alert("Please enter a world name.");
    
    setIsGenerating(true);
    
    // We use Pollinations to generate a one-off image for this custom world.
    const seed = Math.floor(Math.random() * 100000);
    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`anime manga style high quality masterpiece environment of ${worldName} ${lore}`)}?width=400&height=250&nologo=true&seed=${seed}`;
    
    const newWorld = {
      id: Date.now().toString(),
      name: worldName,
      lore: lore,
      image: imgUrl,
      isPublic
    };

    setTimeout(() => {
      setIsGenerating(false);
      onCreate(newWorld);
    }, 1500); // Simulate network delay for UI feel
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--accent-cyan)' }}>
        <h3 style={{ color: 'var(--accent-cyan)', textAlign: 'center', fontSize: '1.5rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Forge New Reality</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reality Name</label>
            <input 
              type="text" 
              value={worldName} 
              onChange={e => setWorldName(e.target.value)} 
              placeholder="e.g., Cyberpunk Neo-Tokyo"
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lore / Rules (Optional)</label>
            <textarea 
              value={lore} 
              onChange={e => setLore(e.target.value)} 
              placeholder="Describe the atmosphere, tech level, magic system, or specific rules for the Game Master..."
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', height: '100px', resize: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                checked={isPublic} 
                onChange={() => setIsPublic(true)} 
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              Public (Explore)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                checked={!isPublic} 
                onChange={() => setIsPublic(false)} 
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              Private (Only Me)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase' }}>
              Cancel
            </button>
            <button type="submit" disabled={isGenerating} style={{ flex: 1, padding: '12px', background: 'var(--accent-cyan)', border: 'none', color: '#000', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.2s' }}>
              {isGenerating ? "Synthesizing..." : "Initialize"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateWorldModal;
