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
      tokens INTEGER DEFAULT 50,
      last_refresh TEXT
    )`);

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

// Memory Vault logic
// 650 limit threshold
export async function enforceMemoryVault(lobbyId, model) {
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
          const result = await model.generateContent(prompt);
          const newSummary = result.response.text();
          
          db.run(`INSERT INTO memory_vault (lobby_id, summary) VALUES (?, ?) ON CONFLICT(lobby_id) DO UPDATE SET summary = ?`, 
            [lobbyId, newSummary, newSummary], () => {
              
              const placeholders = excessIds.map(() => '?').join(',');
              db.run(`DELETE FROM messages WHERE id IN (${placeholders})`, excessIds, () => {
                resolve();
              });
          });
        } catch(e) {
          console.error("Vault compression failed:", e);
          resolve(); // gracefully degrade
        }
      });
    });
  });
}
