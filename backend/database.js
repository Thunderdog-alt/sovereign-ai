import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.NODE_ENV === 'production'
  ? '/tmp/database.sqlite'
  : join(__dirname, 'database.sqlite');

export const db = new sqlite3.Database(dbPath);

export function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      tokens INTEGER DEFAULT 50,
      last_refresh TEXT
    )`);
    // Add email column if it doesn't exist yet (migration)
    db.run(`ALTER TABLE users ADD COLUMN email TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lobby_id TEXT,
      username TEXT,
      role TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS memory_vault (
      lobby_id TEXT PRIMARY KEY,
      summary TEXT DEFAULT ''
    )`);
  });
}

// Memory Vault: compress messages > 650 into a lore summary
// Accepts a modelHandle object: { type: 'oauth', token } or { type: 'apikey', model }
export async function enforceMemoryVault(lobbyId, modelHandle) {
  return new Promise((resolve) => {
    db.all(`SELECT id, role, content FROM messages WHERE lobby_id = ? ORDER BY id ASC`, [lobbyId], async (err, rows) => {
      if (err || !rows || rows.length <= 650) return resolve();
      
      const excessCount = rows.length - 650;
      if (excessCount <= 0) return resolve();
      
      const excessMessages = rows.slice(0, excessCount);
      const excessIds = excessMessages.map(m => m.id);
      let chatLogToSummarize = excessMessages.map(m => `[${m.role}]: ${m.content}`).join('\n');
      
      db.get(`SELECT summary FROM memory_vault WHERE lobby_id = ?`, [lobbyId], async (err, vault) => {
        let existingSummary = vault ? vault.summary : '';
        let prompt = `You are a memory archivist. Summarize the following past events into a concise, dense lore document. Combine it seamlessly with the existing summary.\n\nEXISTING SUMMARY:\n${existingSummary}\n\nNEW EVENTS TO ARCHIVE:\n${chatLogToSummarize}`;
        
        try {
          let newSummary;
          
          if (modelHandle && modelHandle.type === 'oauth') {
            // Use OAuth token for vault summarization too
            const body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
            const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${modelHandle.token}` },
              body
            });
            const data = await res.json();
            newSummary = data.candidates?.[0]?.content?.parts?.[0]?.text || existingSummary;
          } else if (modelHandle && modelHandle.type === 'apikey') {
            const result = await modelHandle.model.generateContent(prompt);
            newSummary = result.response.text();
          } else {
            return resolve(); // No model available, skip vault compression
          }
          
          db.run(`INSERT INTO memory_vault (lobby_id, summary) VALUES (?, ?) ON CONFLICT(lobby_id) DO UPDATE SET summary = ?`, 
            [lobbyId, newSummary, newSummary], () => {
              const placeholders = excessIds.map(() => '?').join(',');
              db.run(`DELETE FROM messages WHERE id IN (${placeholders})`, excessIds, () => resolve());
            });
        } catch(e) {
          console.error('Vault compression failed:', e.message);
          resolve();
        }
      });
    });
  });
}
