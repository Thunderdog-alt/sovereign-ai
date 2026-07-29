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
    // Migrations — safe to run on existing databases
    db.run(`ALTER TABLE users ADD COLUMN email TEXT`, () => {});

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lobby_id TEXT,
      username TEXT,
      role TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Memory Vault: stores the FULL TEXT of every message that falls out of the 650-message active window.
    // Each lobby has ONE vault row. The 'archive' column is a running log of all archived messages.
    db.run(`CREATE TABLE IF NOT EXISTS memory_vault (
      lobby_id TEXT PRIMARY KEY,
      archive TEXT DEFAULT '',
      archived_count INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration: rename old 'summary' column if it exists (old schema)
    db.run(`ALTER TABLE memory_vault ADD COLUMN archive TEXT DEFAULT ''`, () => {});
    db.run(`ALTER TABLE memory_vault ADD COLUMN archived_count INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE memory_vault ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP`, () => {});
  });
}

const MAX_ACTIVE_MESSAGES = 650;

/**
 * Memory Vault Enforcement
 * 
 * When the active message count exceeds 650, ONLY the oldest message(s)
 * that are "falling out" get moved to the vault. The vault stores the
 * FULL ORIGINAL TEXT of every archived message — nothing is lost.
 * 
 * For example: when message #651 arrives, message #1 moves to vault.
 * Message #1's full content is appended to the vault archive forever.
 */
export async function enforceMemoryVault(lobbyId) {
  return new Promise((resolve) => {
    db.all(
      `SELECT id, role, username, content, timestamp FROM messages WHERE lobby_id = ? ORDER BY id ASC`,
      [lobbyId],
      (err, rows) => {
        if (err || !rows || rows.length <= MAX_ACTIVE_MESSAGES) return resolve();

        // How many messages are falling out?
        const excessCount = rows.length - MAX_ACTIVE_MESSAGES;
        const fallingOutMessages = rows.slice(0, excessCount); // Only the ones being pushed out
        const fallingOutIds = fallingOutMessages.map(m => m.id);

        // Format the falling-out messages into a permanent archive entry
        const archiveEntry = fallingOutMessages
          .map(m => `[${m.timestamp || 'unknown time'}] [${m.username || m.role}]: ${m.content}`)
          .join('\n') + '\n---\n';

        // Append to vault archive (full text preserved forever)
        db.get(
          `SELECT archive, archived_count FROM memory_vault WHERE lobby_id = ?`,
          [lobbyId],
          (err, vault) => {
            const existingArchive = vault ? (vault.archive || '') : '';
            const existingCount = vault ? (vault.archived_count || 0) : 0;
            const newArchive = existingArchive + archiveEntry;
            const newCount = existingCount + fallingOutMessages.length;

            db.run(
              `INSERT INTO memory_vault (lobby_id, archive, archived_count, last_updated)
               VALUES (?, ?, ?, datetime('now'))
               ON CONFLICT(lobby_id) DO UPDATE SET
                 archive = ?,
                 archived_count = ?,
                 last_updated = datetime('now')`,
              [lobbyId, newArchive, newCount, newArchive, newCount],
              () => {
                // Remove the fallen messages from the active messages table
                const placeholders = fallingOutIds.map(() => '?').join(',');
                db.run(
                  `DELETE FROM messages WHERE id IN (${placeholders})`,
                  fallingOutIds,
                  () => {
                    console.log(`[Vault] Archived ${fallingOutMessages.length} message(s) for lobby ${lobbyId}. Total archived: ${newCount}`);
                    resolve();
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

/**
 * Retrieve the vault archive for a lobby (for display in the UI or AI context injection)
 */
export function getVaultArchive(lobbyId) {
  return new Promise((resolve) => {
    db.get(
      `SELECT archive, archived_count, last_updated FROM memory_vault WHERE lobby_id = ?`,
      [lobbyId],
      (err, vault) => {
        if (err || !vault) return resolve({ archive: '', archived_count: 0 });
        resolve(vault);
      }
    );
  });
}
