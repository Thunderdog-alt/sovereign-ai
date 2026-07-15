import { db, enforceMemoryVault } from './database.js';

export const lobbies = {};

export function setupSocket(io, model) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_lobby', ({ lobbyId, username, world, timeLimit, systemType, gameMode }) => {
      socket.join(lobbyId);
      if (!lobbies[lobbyId]) {
        lobbies[lobbyId] = {
          id: lobbyId,
          host: username,
          players: [],
          status: 'waiting',
          world,
          timeLimit: timeLimit || 0,
          systemType: systemType || 'None',
          gameMode: gameMode || 'Start from Scratch',
          pendingActions: [],
          turnStartTime: null,
          timer: null
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
          await processTurn(io, model, lobbyId, true);
        });
        return;
      }

      lobby.pendingActions.push({ username, action });
      db.run(`INSERT INTO messages (lobby_id, username, role, content) VALUES (?, ?, 'user', ?)`,
        [lobbyId, username, action]);

      io.to(lobbyId).emit('action_received', { username, action });
      io.to(lobbyId).emit('lobby_state', lobby);

      if (lobby.pendingActions.length >= lobby.players.length) {
        await processTurn(io, model, lobbyId);
      } else if (!lobby.timer && lobby.timeLimit > 0) {
        lobby.timer = setTimeout(() => {
          processTurn(io, model, lobbyId);
        }, lobby.timeLimit * 1000);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

async function processTurn(io, model, lobbyId, isRegen = false) {
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

  // Enforce memory vault before generating new response
  await enforceMemoryVault(lobbyId, model);

  db.get(`SELECT summary FROM memory_vault WHERE lobby_id = ?`, [lobbyId], (err, vault) => {
    let memorySummary = vault && vault.summary ? `\n[VAULT MEMORY]: ${vault.summary}` : '';

    let aggregatedPrompt = `[System Instructions]: The world is ${lobby.world}. You are the Game Master.
Game Mode: ${lobby.gameMode}.
If the mode is 'God Mode', the player has absolute control over the narrative; you must bend reality to their will.
If the mode is 'Start from Scratch', the player is grounded, vulnerable, and must struggle; actions can fail, injuries happen, and you must strictly enforce logical consequences.
The player has the following System: ${lobby.systemType}.${memorySummary}

IMPORTANT RULES (ABSOLUTE):
1. ABSOLUTE ZERO GOD-MODING: You are completely FORBIDDEN from writing dialogue, thoughts, movements, choices, or emotional responses for the player character. You only direct environmental variables and independent NPCs.
2. AUTOMATIC PAUSE: Stop writing sentences immediately after your immediate environment or NPCs react. Never forecast or control what the user does on their next choice loop.
3. SHADOW INTERNAL MONOLOGUES: NPCs alone possess internal thought paths. Format these strictly inside *italics* to represent calculating intent, secret metrics, or cognitive biases unknown to the player.
4. INDEPENDENT DYNAMIC UNIVERSE: The setting persists dynamically. NPCs possess autonomous tasks, conflicts, schedules, and agendas independent of the user's presence.
5. NO STRUCTURAL PROMPTING: Never break immersion by adding conversational tags like "What do you do next?" or offering options. Deliver raw scene transitions and stop.
6. COMPACT TEXT FLOW: Maintain structural weight. Write a minimum of 1 paragraph and maximum of 3 paragraphs per interaction turn.
7. SYSTEM INTEGRATION: Explicitly mirror user system mechanics within environmental responses (e.g., call attention to favorability, slack mechanics, check-ins, or summoning artifacts).
8. CONTEXT OVERWATCH: Retain absolute precise continuity from preceding turns. Every choice made must carry cascading narrative ripple consequences.
9. DYNAMIC REWARDS LOGIC: You must append mechanical output tags to the literal end of your narrative block for parse processing. Use: <EXP:+X>, <GOLD:+X>, <HP:-X>, or <MP:-X> based on environmental hazards or achievements.
10. DYNAMIC MOOD TRACKING: You MUST append a single mood tag at the very end of your response to dictate the background music. Choose EXACTLY ONE from: <MOOD:Happy>, <MOOD:Sad>, <MOOD:Boss>, <MOOD:Fight>, <MOOD:Romance>, <MOOD:Stealth>, <MOOD:Slick>, <MOOD:Neutral>.
11. DEBUFF TRACKING: If the player suffers any injuries, ailments, or negative status effects, append a debuff tag at the end: <DEBUFFS:Injury1,Injury2,...>. If no active debuffs exist, do NOT append the tag. Examples of valid debuffs: Bleeding, Broken Arm, Exhausted, Poisoned, Blinded, Cursed.
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

    db.all(`SELECT role, content FROM messages WHERE lobby_id = ? ORDER BY id ASC`, [lobbyId], async (err, history) => {
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
  });
}
