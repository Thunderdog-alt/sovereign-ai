import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true }
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Serve frontend in production
const frontendDist = join(__dirname, '..', 'dist');
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

import { initDatabase, db } from './database.js';
import { setupSocket } from './socketHandler.js';

initDatabase();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sovereign_CHANGE_ME';
const FALLBACK_GEMINI_KEY = process.env.GEMINI_API_KEY;

/**
 * Creates a Gemini model using:
 * 1. The user's own Google OAuth access_token (their quota, not yours!) — preferred
 * 2. The server's GEMINI_API_KEY as fallback for username/password users
 */
export function getGeminiModel(userAccessToken) {
  if (userAccessToken && userAccessToken !== 'null' && userAccessToken !== '') {
    // Each user uses their OWN Google account quota via OAuth Bearer token
    // We call the REST API directly with the token
    return { type: 'oauth', token: userAccessToken };
  }
  if (FALLBACK_GEMINI_KEY && FALLBACK_GEMINI_KEY !== 'your_gemini_api_key_here') {
    const genAI = new GoogleGenerativeAI(FALLBACK_GEMINI_KEY);
    return { type: 'apikey', model: genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) };
  }
  return null;
}

// --- AUTHENTICATION ROUTES ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const hash = bcrypt.hashSync(password, 8);
  db.run(`INSERT INTO users (username, password, last_refresh) VALUES (?, ?, datetime('now'))`, [username, hash], function(err) {
    if (err) return res.status(400).json({ error: 'Username already taken' });
    const token = jwt.sign({ id: this.lastID, username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: user.username });
  });
});

// --- GOOGLE OAUTH ROUTE ---
// Called after user signs in with Google on the frontend.
// Verifies the access_token, auto-creates the user if new, returns a session token.
app.post('/api/google-auth', async (req, res) => {
  const { email, name, access_token } = req.body;
  if (!email || !access_token) return res.status(400).json({ error: 'Email and access_token required' });

  try {
    // Verify the Google access token is real
    const verifyRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    if (!verifyRes.ok) return res.status(401).json({ error: 'Invalid Google token' });
    
    const googleUser = await verifyRes.json();
    if (googleUser.email !== email) return res.status(401).json({ error: 'Token email mismatch' });

    const displayName = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_');

    // Upsert: auto-register if new user, login if existing
    db.run(
      `INSERT OR IGNORE INTO users (username, password, last_refresh) VALUES (?, 'google_oauth', datetime('now'))`,
      [displayName],
      function() {
        db.get(`SELECT * FROM users WHERE username = ?`, [displayName], (err, user) => {
          if (!user) return res.status(500).json({ error: 'Failed to create user' });
          const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
          res.json({ token, username: user.username });
        });
      }
    );
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

app.get('/api/lobbies', (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username required' });
  db.all(`SELECT DISTINCT lobby_id FROM messages WHERE username = ? ORDER BY timestamp DESC`, [username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.lobby_id));
  });
});

// Memory Vault viewer endpoint
app.get('/api/vault/:lobbyId', (req, res) => {
  const { lobbyId } = req.params;
  db.get(
    `SELECT archive, archived_count, last_updated FROM memory_vault WHERE lobby_id = ?`,
    [lobbyId],
    (err, vault) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!vault) return res.json({ archive: '', archived_count: 0, last_updated: null });
      res.json(vault);
    }
  );
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

if (existsSync(frontendDist)) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(join(frontendDist, 'index.html'));
    }
  });
}

setupSocket(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sovereign AI Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});
