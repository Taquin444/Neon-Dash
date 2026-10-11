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

// --- STATIC FRONTEND FILE SERVING MIDDLEWARE ---
// Points to the client-side 'dist' directory located outside of 'dist-server'
app.use(express.static(path.join(__dirname, '../dist')));

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

const defaultLeaderboards: LeaderboardEntry[] = [
  { id: '1', name: 'CyberPhantom', character: 'Neon Ninja', score: 28450, stage: 5, wins: 42, date: 'Today' },
  { id: '2', name: 'Valkyrie99', character: 'Valkyrie Mecha', score: 24100, stage: 5, wins: 36, date: 'Today' },
  { id: '3', name: 'GlitchRunner', character: 'Cyber Punk', score: 19800, stage: 4, wins: 28, date: 'Yesterday' },
  { id: '4', name: 'ShadowX', character: 'Shadow Ronin', score: 17500, stage: 4, wins: 21, date: '2d ago' },
  { id: '5', name: 'HyperPulse', character: 'Neon Ninja', score: 15320, stage: 3, wins: 15, date: '3d ago' },
  { id: '6', name: 'NovaStrike', character: 'Valkyrie Mecha', score: 12900, stage: 3, wins: 12, date: '3d ago' },
  { id: '7', name: 'AeroZero', character: 'Cyber Punk', score: 10400, stage: 2, wins: 9, date: '4d ago' },
  { id: '8', name: 'ByteMaster', character: 'Shadow Ronin', score: 8650, stage: 2, wins: 6, date: '5d ago' },
];

let leaderboard: LeaderboardEntry[] = [...defaultLeaderboards];

const playerProfiles: Record<string, any> = {};

// REST endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/leaderboard', (_req, res) => {
  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
  res.json({ success: true, leaderboard: sorted });
});

app.post('/api/leaderboard', (req, res) => {
  const { name, character, score, stage, wins } = req.body;
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

  const sorted = [...leaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
  res.json({ success: true, leaderboard: sorted });
});

app.get('/api/profile/:username', (req, res) => {
  const username = req.params.username.toLowerCase();
  const profile = playerProfiles[username] || null;
  res.json({ success: true, profile });
});

app.post('/api/profile/save', (req, res) => {
  const { username, data } = req.body;
  if (!username || !data) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  playerProfiles[username.toLowerCase()] = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true });
});

// --- FRONTEND CATCH-ALL ROUTE ---
// Directs all root browser entries toward the Vite built HTML index file
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
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
  countdown?: number;
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

wss.on('connection', (ws) => {
  let currentRoomCode: string | null = null;
  let playerId = 'p_' + Math.random().toString(36).substring(2, 9);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type, payload } = msg;

      switch (type) {
        case 'CREATE_ROOM': {
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

          broadcastToRoom(room, { type: 'PLAYER_JOINED', payload: { room: getRoomSnapshot(room) } });
          ws.send(JSON.stringify({ type: 'JOIN_SUCCESS', payload: { room: getRoomSnapshot(room), yourId: playerId } }));
          break;
        }
      }
    } catch (err) {
      console.error(err);
    }
  });
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
