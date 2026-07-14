import React, { useState } from 'react';
import { useGameState } from '../context/gameStateContext';

const PersonaSetup = ({ onComplete, onCancel }) => {
  const { characterName, setCharacterName, characterDescription, setCharacterDescription, setAvatarImage } = useGameState();
  const [name, setName] = useState(characterName || '');
  const [desc, setDesc] = useState(characterDescription || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Please enter a character name.");
    
    setCharacterName(name);
    setCharacterDescription(desc);

    // Auto-generate avatar if none exists (just a fast pollinations link that resolves instantly based on name)
    setAvatarImage(`https://image.pollinations.ai/prompt/${encodeURIComponent(`anime manga style portrait of ${name}, ${desc}`)}?width=150&height=150&nologo=true`);
    
    onComplete();
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid var(--accent-magenta)' }}>
        <h3 style={{ color: 'var(--accent-magenta)', textAlign: 'center', fontSize: '1.5rem', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>Define Your Persona</h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Character Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Kaelen Vanguard"
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Appearance / Background (Optional)</label>
            <textarea 
              value={desc} 
              onChange={e => setDesc(e.target.value)} 
              placeholder="e.g., A rogue with silver hair and glowing blue eyes, carrying a cursed blade..."
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', height: '100px', resize: 'none', fontSize: '0.9rem', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onCancel} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase' }}>
              Cancel
            </button>
            <button type="submit" disabled={isGenerating} style={{ flex: 1, padding: '12px', background: 'var(--accent-magenta)', border: 'none', color: '#000', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', transition: 'all 0.2s' }}>
              Confirm Persona
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonaSetup;
