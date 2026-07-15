import React from 'react';

const ChatActionMenu = ({ setActionMenuOpen, setInputValue, skills }) => {
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: '0%', marginBottom: '20px', 
      background: 'rgba(10, 10, 15, 0.98)', border: '1px solid var(--accent-cyan)',
      borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px',
      boxShadow: '0 0 40px rgba(0,240,255,0.2)', zIndex: 100, width: '400px', maxHeight: '500px', overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--accent-cyan)', margin: 0 }}>Action Hub</h3>
        <button onClick={() => setActionMenuOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>X</button>
      </div>
      <hr style={{ borderColor: 'var(--glass-border)', margin: '0' }} />

      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '5px', textTransform: 'uppercase' }}>Quick Actions</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {['Look around', 'Equip weapon', 'Hands behind back', 'Look nonchalant', 'Look surprised', 'Smile wickedly', 'Stay silent', 'Nod slowly', 'Frown', 'Examine item', 'Attack', 'Defend'].map(act => (
          <button key={act} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' }}
            onClick={() => {
              setInputValue(prev => prev ? `${prev} *${act.toLowerCase()}*` : `*${act.toLowerCase()}*`);
              setActionMenuOpen(false);
            }}
            onMouseOver={e => e.target.style.borderColor = 'var(--accent-cyan)'}
            onMouseOut={e => e.target.style.borderColor = 'var(--glass-border)'}
          >{act}</button>
        ))}
      </div>

      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '5px', marginTop: '10px', textTransform: 'uppercase' }}>Abilities Quick-Cast</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {skills?.map(skill => (
          <button key={skill} style={{ background: 'rgba(255,0,85,0.05)', border: '1px solid var(--accent-magenta)', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' }}
            onClick={() => {
              setInputValue(prev => prev ? `${prev} *casts ${skill}*` : `*casts ${skill}*`);
              setActionMenuOpen(false);
            }}
            onMouseOver={e => e.target.style.background = 'rgba(255,0,85,0.2)'}
            onMouseOut={e => e.target.style.background = 'rgba(255,0,85,0.05)'}
          >{skill}</button>
        ))}
      </div>
    </div>
  );
};

export default ChatActionMenu;
