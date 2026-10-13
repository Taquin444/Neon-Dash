import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const server = http.createServer(app);

// In-memory data store for persistent experience
interface LeaderboardEntry {
  id: string;
  name: string;
  character: string;
  score: number;
  stage: number;
  wins: number;
  date: string;
}

import fs from 'fs';

// Persistence directory
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const usersFilePath = path.join(dataDir, 'users.json');
const leaderboardFilePath = path.join(dataDir, 'leaderboard.json');
const arenaAgentFilePath = path.join(dataDir, 'arena-agent.json');

// Real-time leaderboard: ONLY actual players who play the game
let leaderboard: LeaderboardEntry[] = [];
if (fs.existsSync(leaderboardFilePath)) {
  try {
    const raw = fs.readFileSync(leaderboardFilePath, 'utf-8');
    leaderboard = JSON.parse(raw);
  } catch {
    leaderboard = [];
  }
}

function persistLeaderboard() {
  try {
    fs.writeFileSync(leaderboardFilePath, JSON.stringify(leaderboard, null, 2));
  } catch (err) {
    console.error('Error saving leaderboard:', err);
  }
}

// User accounts database
interface UserAccount {
  username: string;
  passcode: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

let users: Record<string, UserAccount> = {};
if (fs.existsSync(usersFilePath)) {
  try {
    const raw = fs.readFileSync(usersFilePath, 'utf-8');
    users = JSON.parse(raw);
  } catch {
    users = {};
  }
}

function persistUsers() {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

// REST endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Stored reference to the Arena agent supplied by the project owner.
app.get('/api/arena-agent', (_req, res) => {
  try {
    const source = JSON.parse(fs.readFileSync(arenaAgentFilePath, 'utf-8'));
    res.json({ success: true, ...source });
  } catch (err) {
    console.error('Error reading Arena agent reference:', err);
    res.status(500).json({ success: false, error: 'Arena agent reference is unavailable.' });
  }
});

// Real-Time Leaderboard endpoint
app.get('/api/leaderboard', (_req, res) => {
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 30);
  res.json({ success: true, leaderboard: sorted });
});

app.post('/api/leaderboard', (req, res) => {
  const { name, character, score, stage, wins } = req.body || {};
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const existingIdx = leaderboard.findIndex((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existingIdx >= 0) {
    if (score > leaderboard[existingIdx].score) {
      leaderboard[existingIdx].score = score;
      leaderboard[existingIdx].stage = Math.max(leaderboard[existingIdx].stage, stage || 1);
      leaderboard[existingIdx].character = character || leaderboard[existingIdx].character;
      leaderboard[existingIdx].date = 'Just now';
    }
    leaderboard[existingIdx].wins = Math.max(leaderboard[existingIdx].wins, wins || leaderboard[existingIdx].wins);
  } else {
    leaderboard.push({
      id: String(Date.now()),
      name,
      character: character || 'Neon Ninja',
      score,
      stage: stage || 1,
      wins: wins || 0,
      date: 'Just now',
    });
  }

  persistLeaderboard();
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 30);
  res.json({ success: true, leaderboard: sorted });
});

// Pilot Authentication: Register New Pilot
app.post('/api/auth/register', (req, res) => {
  const { username, password, initialData } = req.body || {};
  const cleanName = (username || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanName || cleanName.length < 3) {
    return res.status(400).json({ error: 'Callsign must be at least 3 characters.' });
  }
  if (!cleanPass || cleanPass.length < 3) {
    return res.status(400).json({ error: 'Security passcode must be at least 3 characters.' });
  }

  const key = cleanName.toLowerCase();
  if (users[key]) {
    return res.status(409).json({ error: 'Pilot callsign is already registered. Please log in.' });
  }

  const userData = initialData || {};
  users[key] = {
    username: cleanName,
    passcode: cleanPass,
    data: {
      ...userData,
      username: cleanName,
      isLoggedIn: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  persistUsers();

  // If score > 0, include on real-time leaderboard
  if (userData.highScore > 0) {
    const existingIdx = leaderboard.findIndex((e) => e.name.toLowerCase() === cleanName.toLowerCase());
    if (existingIdx >= 0) {
      leaderboard[existingIdx].score = Math.max(leaderboard[existingIdx].score, userData.highScore);
    } else {
      leaderboard.push({
        id: String(Date.now()),
        name: cleanName,
        character: userData.selectedCharacter || 'Neon Ninja',
        score: userData.highScore,
        stage: userData.maxStageUnlocked || 1,
        wins: userData.multiplayerWins || 0,
        date: 'Just now',
      });
      persistLeaderboard();
    }
  }

  res.json({
    success: true,
    message: `Pilot ${cleanName} successfully registered!`,
    profile: users[key].data,
  });
});

// Pilot Authentication: Login Existing Pilot
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const cleanName = (username || '').trim();
  const cleanPass = (password || '').trim();

  if (!cleanName || !cleanPass) {
    return res.status(400).json({ error: 'Callsign and passcode are required.' });
  }

  const key = cleanName.toLowerCase();
  const user = users[key];
  if (!user) {
    return res.status(404).json({ error: 'Pilot callsign not found. Please create an identity first.' });
  }

  if (user.passcode !== cleanPass) {
    return res.status(401).json({ error: 'Incorrect security passcode.' });
  }

  res.json({
    success: true,
    message: `Welcome back, Pilot ${user.username}!`,
    profile: user.data,
  });
});

// Profile REST endpoints
app.get('/api/profile/:username', (req, res) => {
  const username = req.params.username.toLowerCase();
  const user = users[username];
  res.json({ success: true, profile: user ? user.data : null });
});

app.post('/api/profile/save', (req, res) => {
  const { username, data } = req.body || {};
  if (!username || !data) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const key = username.toLowerCase();
  if (users[key]) {
    users[key].data = {
      ...users[key].data,
      ...data,
      username: users[key].username, // keep canonical casing
      isLoggedIn: true,
    };
    users[key].updatedAt = new Date().toISOString();
  } else {
    users[key] = {
      username,
      passcode: 'guest',
      data: { ...data, username, isLoggedIn: true },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  persistUsers();

  // Keep leaderboard in sync with player's latest high score
  if (data.highScore > 0) {
    const existingIdx = leaderboard.findIndex((e) => e.name.toLowerCase() === key);
    if (existingIdx >= 0) {
      if (data.highScore > leaderboard[existingIdx].score) {
        leaderboard[existingIdx].score = data.highScore;
        leaderboard[existingIdx].stage = Math.max(leaderboard[existingIdx].stage, data.maxStageUnlocked || 1);
        leaderboard[existingIdx].date = 'Today';
      }
    } else {
      leaderboard.push({
        id: String(Date.now()),
        name: users[key].username,
        character: data.selectedCharacter || 'Neon Ninja',
        score: data.highScore,
        stage: data.maxStageUnlocked || 1,
        wins: data.multiplayerWins || 0,
        date: 'Today',
      });
    }
    persistLeaderboard();
  }

  res.json({ success: true });
});

// WebSocket Server for Real-Time Multiplayer
const wss = new WebSocketServer({ server });

interface PlayerState {
  ws: WebSocket;
  id: string;
  name: string;
  character: string;
  ready: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  progress: number;
  spriteState: string;
  facing: 'left' | 'right';
  health: number;
  score: number;
  finished: boolean;
  finishTime?: number;
  activePowerups?: string[];
}

interface Room {
  code: string;
  hostId: string;
  stage: number;
  status: 'waiting' | 'countdown' | 'racing' | 'ended';
  players: Map<string, PlayerState>;
  countdownTimer?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function broadcastToRoom(room: Room, message: any, excludePlayerId?: string) {
  const data = JSON.stringify(message);
  room.players.forEach((player, id) => {
    if (id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(data);
    }
  });
}

function getRoomSnapshot(room: Room) {
  const playerList: any[] = [];
  room.players.forEach((p) => {
    playerList.push({
      id: p.id,
      name: p.name,
      character: p.character,
      ready: p.ready,
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      progress: p.progress,
      spriteState: p.spriteState,
      facing: p.facing,
      health: p.health,
      score: p.score,
      finished: p.finished,
      finishTime: p.finishTime,
      activePowerups: p.activePowerups || [],
    });
  });

  return {
    code: room.code,
    hostId: room.hostId,
    stage: room.stage,
    status: room.status,
    players: playerList,
  };
}

function removePlayerFromRoom(roomCode: string, playerId: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.players.delete(playerId);
  if (room.players.size === 0) {
    if (room.countdownTimer) clearInterval(room.countdownTimer);
    rooms.delete(roomCode);
  } else {
    if (room.hostId === playerId) {
      const nextHostId = room.players.keys().next().value;
      if (nextHostId) room.hostId = nextHostId;
    }
    broadcastToRoom(room, {
      type: 'ROOM_UPDATE',
      payload: { room: getRoomSnapshot(room) },
    });
  }
}

wss.on('connection', (ws) => {
  let currentRoomCode: string | null = null;
  const playerId = 'p_' + Math.random().toString(36).substring(2, 9);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type, payload } = msg;

      switch (type) {
        case 'CREATE_ROOM': {
          if (currentRoomCode) {
            removePlayerFromRoom(currentRoomCode, playerId);
          }

          const roomCode = generateRoomCode();
          const room: Room = {
            code: roomCode,
            hostId: playerId,
            stage: payload?.stage || 1,
            status: 'waiting',
            players: new Map(),
          };

          const player: PlayerState = {
            ws,
            id: playerId,
            name: payload?.name || 'Racer 1',
            character: payload?.character || 'Neon Ninja',
            ready: true,
            x: 50,
            y: 0,
            vx: 0,
            vy: 0,
            progress: 0,
            spriteState: 'idle',
            facing: 'right',
            health: 100,
            score: 0,
            finished: false,
          };

          room.players.set(playerId, player);
          rooms.set(roomCode, room);
          currentRoomCode = roomCode;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            payload: { room: getRoomSnapshot(room), yourId: playerId },
          }));
          break;
        }

        case 'JOIN_ROOM': {
          const code = (payload?.code || '').toUpperCase().trim();
          const room = rooms.get(code);

          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Room not found. Check the code!' } }));
            return;
          }

          if (room.players.size >= 4) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Room is full (max 4 racers)!' } }));
            return;
          }

          if (room.status === 'racing') {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Match already in progress!' } }));
            return;
          }

          if (currentRoomCode) {
            removePlayerFromRoom(currentRoomCode, playerId);
          }

          const player: PlayerState = {
            ws,
            id: playerId,
            name: payload?.name || `Racer ${room.players.size + 1}`,
            character: payload?.character || 'Cyber Punk',
            ready: false,
            x: 50,
            y: 0,
            vx: 0,
            vy: 0,
            progress: 0,
            spriteState: 'idle',
            facing: 'right',
            health: 100,
            score: 0,
            finished: false,
          };

          room.players.set(playerId, player);
          currentRoomCode = code;

          const snapshot = getRoomSnapshot(room);
          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            payload: { room: snapshot, yourId: playerId },
          }));
          broadcastToRoom(room, {
            type: 'ROOM_UPDATE',
            payload: { room: snapshot },
          }, playerId);
          break;
        }

        case 'QUICK_MATCH': {
          if (currentRoomCode) {
            removePlayerFromRoom(currentRoomCode, playerId);
          }

          // Find waiting room with available slot
          let targetRoom: Room | null = null;
          for (const r of rooms.values()) {
            if (r.status === 'waiting' && r.players.size < 4) {
              targetRoom = r;
              break;
            }
          }

          if (targetRoom) {
            const player: PlayerState = {
              ws,
              id: playerId,
              name: payload?.name || `Racer ${targetRoom.players.size + 1}`,
              character: payload?.character || 'Cyber Punk',
              ready: true,
              x: 50,
              y: 0,
              vx: 0,
              vy: 0,
              progress: 0,
              spriteState: 'idle',
              facing: 'right',
              health: 100,
              score: 0,
              finished: false,
            };

            targetRoom.players.set(playerId, player);
            currentRoomCode = targetRoom.code;

            const snapshot = getRoomSnapshot(targetRoom);
            ws.send(JSON.stringify({
              type: 'ROOM_JOINED',
              payload: { room: snapshot, yourId: playerId },
            }));
            broadcastToRoom(targetRoom, {
              type: 'ROOM_UPDATE',
              payload: { room: snapshot },
            }, playerId);
          } else {
            // Create new room
            const roomCode = generateRoomCode();
            const room: Room = {
              code: roomCode,
              hostId: playerId,
              stage: payload?.stage || 1,
              status: 'waiting',
              players: new Map(),
            };

            const player: PlayerState = {
              ws,
              id: playerId,
              name: payload?.name || 'Racer 1',
              character: payload?.character || 'Neon Ninja',
              ready: true,
              x: 50,
              y: 0,
              vx: 0,
              vy: 0,
              progress: 0,
              spriteState: 'idle',
              facing: 'right',
              health: 100,
              score: 0,
              finished: false,
            };

            room.players.set(playerId, player);
            rooms.set(roomCode, room);
            currentRoomCode = roomCode;

            ws.send(JSON.stringify({
              type: 'ROOM_CREATED',
              payload: { room: getRoomSnapshot(room), yourId: playerId },
            }));
          }
          break;
        }

        case 'SET_READY': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.players.get(playerId);
          if (player) {
            player.ready = Boolean(payload?.ready);
            broadcastToRoom(room, {
              type: 'ROOM_UPDATE',
              payload: { room: getRoomSnapshot(room) },
            });
          }
          break;
        }

        case 'START_MATCH': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.hostId !== playerId) return;

          if (payload?.stage) {
            room.stage = payload.stage;
          }

          room.status = 'countdown';
          let countdown = 3;
          broadcastToRoom(room, {
            type: 'MATCH_COUNTDOWN',
            payload: { seconds: countdown },
          });

          if (room.countdownTimer) clearInterval(room.countdownTimer);
          room.countdownTimer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
              if (room.countdownTimer) clearInterval(room.countdownTimer);
              room.status = 'racing';
              room.players.forEach((p) => {
                p.x = 50;
                p.y = 0;
                p.vx = 0;
                p.vy = 0;
                p.progress = 0;
                p.health = 100;
                p.score = 0;
                p.finished = false;
                delete p.finishTime;
              });
              broadcastToRoom(room, {
                type: 'MATCH_STARTED',
                payload: { room: getRoomSnapshot(room) },
              });
            } else {
              broadcastToRoom(room, {
                type: 'MATCH_COUNTDOWN',
                payload: { seconds: countdown },
              });
            }
          }, 1000);
          break;
        }

        case 'UPDATE_STATE': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.status !== 'racing') return;

          const player = room.players.get(playerId);
          if (player && payload) {
            player.x = payload.x ?? player.x;
            player.y = payload.y ?? player.y;
            player.vx = payload.vx ?? player.vx;
            player.vy = payload.vy ?? player.vy;
            player.progress = payload.progress ?? player.progress;
            player.spriteState = payload.spriteState ?? player.spriteState;
            player.facing = payload.facing ?? player.facing;
            player.health = payload.health ?? player.health;
            player.score = payload.score ?? player.score;
            player.activePowerups = payload.activePowerups ?? player.activePowerups;

            broadcastToRoom(room, {
              type: 'PLAYER_MOVED',
              payload: {
                id: playerId,
                name: player.name,
                character: player.character,
                ...payload,
              },
            }, playerId);
          }
          break;
        }

        case 'USE_POWERUP': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          broadcastToRoom(room, {
            type: 'POWERUP_TRIGGERED',
            payload: { playerId, powerup: payload?.powerup },
          }, playerId);
          break;
        }

        case 'PLAYER_FINISH': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.players.get(playerId);
          if (player) {
            player.finished = true;
            player.finishTime = payload?.finishTime || Date.now();

            const snapshot = getRoomSnapshot(room);
            broadcastToRoom(room, {
              type: 'PLAYER_FINISHED',
              payload: { room: snapshot },
            });

            // Check if all players finished
            const allFinished = Array.from(room.players.values()).every((p) => p.finished);
            if (allFinished) {
              room.status = 'ended';
              broadcastToRoom(room, {
                type: 'MATCH_ENDED',
                payload: { room: getRoomSnapshot(room) },
              });
            }
          }
          break;
        }

        case 'EMOTE': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          broadcastToRoom(room, {
            type: 'EMOTE_RECEIVED',
            payload: { playerId, emote: payload?.emote },
          });
          break;
        }

        case 'LEAVE_ROOM': {
          if (currentRoomCode) {
            removePlayerFromRoom(currentRoomCode, playerId);
            currentRoomCode = null;
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode) {
      removePlayerFromRoom(currentRoomCode, playerId);
      currentRoomCode = null;
    }
  });
});

// Vite Middleware for Dev / Static Files for Prod
const isProduction = process.env.NODE_ENV === 'production';

async function setupFrontend() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

await setupFrontend();

// Port 3000 on host 0.0.0.0 is the required binding for AI Studio
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Neon Dash server listening on http://0.0.0.0:${PORT}`);
});
