import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sqlite3 from 'sqlite3';
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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Not allowed - ' + origin));
    }
  },
  credentials: true
}));
app.use(express.json());

// Serve frontend in production (if dist folder exists next to backend)
const frontendDist = join(__dirname, '..', 'dist');
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Initialize SQLite — use /tmp on Render (ephemeral), or local for dev
const dbPath = process.env.NODE_ENV === 'production'
  ? '/tmp/database.sqlite'
  : join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);
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
});

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') {
  console.error('WARNING: GEMINI_API_KEY is not set. AI responses will fail.');
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// In-memory lobby state
const lobbies = {};

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sovereign_CHANGE_ME';

// --- AUTHENTICATION ---
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

app.get('/api/lobbies', (req, res) => {
  const username = req.query.username;
  if (!username) return res.status(400).json({ error: 'Username required' });
  db.all(`SELECT DISTINCT lobby_id FROM messages WHERE username = ? ORDER BY timestamp DESC`, [username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.lobby_id));
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// Serve frontend for all non-API routes (SPA routing)
if (existsSync(frontendDist)) {
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(join(frontendDist, 'index.html'));
    }
  });
}

// --- SOCKET.IO MULTIPLAYER ---
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_lobby', ({ lobbyId, username, world, timeLimit, systemType, gameMode }) => {
    socket.join(lobbyId);
    if (!lobbies[lobbyId]) {
      lobbies[lobbyId] = {
        id: lobbyId,
        host: username,
        status: 'waiting',
        world,
        systemType: systemType || 'None',
        gameMode: gameMode || 'Start from Scratch',
        timeLimit: parseInt(timeLimit) || 0,
        players: [],
        pendingActions: [],
        timer: null,
        turnStartTime: null
      };
    }
    if (!lobbies[lobbyId].players.includes(username)) {
      lobbies[lobbyId].players.push(username);
    }
    io.to(lobbyId).emit('lobby_state', lobbies[lobbyId]);
  });

  socket.on('start_game', ({ lobbyId, username }) => {
    const lobby = lobbies[lobbyId];
    if (lobby && lobby.host === username) {
      lobby.status = 'playing';
      lobby.turnStartTime = Date.now();
      io.to(lobbyId).emit('game_started');
      io.to(lobbyId).emit('lobby_state', lobby);
    }
  });

  socket.on('submit_action', async ({ lobbyId, username, action }) => {
    const lobby = lobbies[lobbyId];
    if (!lobby) return;

    if (action === '[SWIPE REGENERATE]') {
      db.run(`DELETE FROM messages WHERE lobby_id = ? AND id = (SELECT MAX(id) FROM messages WHERE lobby_id = ? AND role = 'assistant')`, [lobbyId, lobbyId], async () => {
        io.to(lobbyId).emit('action_received', { username: 'System', action: 'Regenerating previous response...' });
        await processTurn(lobbyId, true);
      });
      return;
    }

    lobby.pendingActions.push({ username, action });
    db.run(`INSERT INTO messages (lobby_id, username, role, content) VALUES (?, ?, 'user', ?)`,
      [lobbyId, username, action]);

    io.to(lobbyId).emit('action_received', { username, action });
    io.to(lobbyId).emit('lobby_state', lobby);

    if (lobby.pendingActions.length >= lobby.players.length) {
      await processTurn(lobbyId);
    } else if (!lobby.timer && lobby.timeLimit > 0) {
      lobby.timer = setTimeout(() => {
        processTurn(lobbyId);
      }, lobby.timeLimit * 1000);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

async function processTurn(lobbyId, isRegen = false) {
  const lobby = lobbies[lobbyId];
  if (!lobby || (!isRegen && lobby.pendingActions.length === 0)) return;

  if (lobby.timer) {
    clearTimeout(lobby.timer);
    lobby.timer = null;
  }

  const actions = lobby.pendingActions;
  lobby.pendingActions = [];
  lobby.turnStartTime = Date.now();
  io.to(lobbyId).emit('lobby_state', lobby);

  let aggregatedPrompt = `[System Instructions]: The world is ${lobby.world}. You are the Game Master.
Game Mode: ${lobby.gameMode}.
If the mode is 'God Mode', the player has absolute control over the narrative; you must bend reality to their will.
If the mode is 'Start from Scratch', the player is grounded, vulnerable, and must struggle; actions can fail, injuries happen, and you must strictly enforce logical consequences.
The player has the following System: ${lobby.systemType}.
IMPORTANT RULES:
1. NPCs must have actual deep emotions, agency, and independent motivations. Do NOT make them "yes men". They should argue, fear, or react logically.
2. Keep descriptions vivid and cinematic.
3. If new companions/characters are introduced naturally, dynamically invent their names and appearances.
`;
  if (actions.length > 0) {
    aggregatedPrompt += `\nThe following players took actions simultaneously:\n`;
    actions.forEach(a => {
      aggregatedPrompt += `[${a.username}]: ${a.action}\n`;
    });
    aggregatedPrompt += `\nResolve these actions simultaneously.`;
  } else if (isRegen) {
    aggregatedPrompt += `\nThe previous response was unsatisfactory. Please REGENERATE your response for the player's last action in a new, creative way.`;
  }

  db.all(`SELECT role, content FROM (SELECT * FROM messages WHERE lobby_id = ? ORDER BY id DESC LIMIT 650) ORDER BY id ASC`, [lobbyId], async (err, history) => {
    try {
      const geminiHistory = (history || []).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(aggregatedPrompt);
      const response = result.response.text();

      db.run(`INSERT INTO messages (lobby_id, username, role, content) VALUES (?, 'Game Master', 'assistant', ?)`,
        [lobbyId, response]);

      io.to(lobbyId).emit('turn_resolved', { actions, resolution: response });

    } catch (e) {
      console.error('Gemini error:', e.message);
      io.to(lobbyId).emit('error', 'Game Master connection failed. Check GEMINI_API_KEY.');
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sovereign AI Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});
