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

import { initDatabase, db } from './database.js';
import { setupSocket, lobbies } from './socketHandler.js';

// Initialize SQLite Database
initDatabase();

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY || GEMINI_KEY === 'your_gemini_api_key_here') {
  console.error('WARNING: GEMINI_API_KEY is not set. AI responses will fail.');
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

// Set up socket logic
setupSocket(io, model);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sovereign AI Server running on port ${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});
