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

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            payload: { room: getRoomSnapshot(room), yourId: playerId },
          }));

          broadcastToRoom(room, {
            type: 'ROOM_UPDATE',
            payload: { room: getRoomSnapshot(room), event: `${player.name} joined the lobby!` },
          }, playerId);
          break;
        }

        case 'QUICK_MATCH': {
          // Look for an open room or create one
          let targetRoom: Room | null = null;
          for (const [, r] of rooms) {
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

            ws.send(JSON.stringify({
              type: 'ROOM_JOINED',
              payload: { room: getRoomSnapshot(targetRoom), yourId: playerId },
            }));

            broadcastToRoom(targetRoom, {
              type: 'ROOM_UPDATE',
              payload: { room: getRoomSnapshot(targetRoom), event: `${player.name} joined quick match!` },
            });
          } else {
            // Create new quick match room
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

          room.status = 'countdown';
          room.stage = payload?.stage || room.stage;

          broadcastToRoom(room, {
            type: 'MATCH_COUNTDOWN',
            payload: { room: getRoomSnapshot(room), seconds: 3 },
          });

          // Countdown sequence
          setTimeout(() => {
            if (rooms.has(room.code)) {
              room.status = 'racing';
              // Reset all player race telemetry
              room.players.forEach((p) => {
                p.x = 60;
                p.y = 0;
                p.vx = 0;
                p.vy = 0;
                p.progress = 0;
                p.finished = false;
                p.health = 100;
              });

              broadcastToRoom(room, {
                type: 'MATCH_STARTED',
                payload: { room: getRoomSnapshot(room) },
              });
            }
          }, 3000);
          break;
        }

        case 'UPDATE_STATE': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.status !== 'racing') return;

          const player = room.players.get(playerId);
          if (player) {
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

            // Broadcast delta to others in the room
            broadcastToRoom(room, {
              type: 'PLAYER_MOVED',
              payload: {
                id: playerId,
                x: player.x,
                y: player.y,
                vx: player.vx,
                vy: player.vy,
                progress: player.progress,
                spriteState: player.spriteState,
                facing: player.facing,
                health: player.health,
                score: player.score,
                activePowerups: player.activePowerups,
              },
            }, playerId);
          }
          break;
        }

        case 'USE_POWERUP': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          // Broadcast combat power-up effect (EMP wave, missile barrage, speed wake)
          broadcastToRoom(room, {
            type: 'POWERUP_TRIGGERED',
            payload: {
              sourceId: playerId,
              powerup: payload.powerup,
              timestamp: Date.now(),
            },
          });
          break;
        }

        case 'PLAYER_FINISH': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const player = room.players.get(playerId);
          if (player && !player.finished) {
            player.finished = true;
            player.finishTime = payload.finishTime;
            player.progress = 100;

            broadcastToRoom(room, {
              type: 'PLAYER_FINISHED',
              payload: {
                playerId,
                finishTime: payload.finishTime,
                room: getRoomSnapshot(room),
              },
            });

            // Check if all finished
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

        case 'SEND_EMOTE': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          broadcastToRoom(room, {
            type: 'EMOTE_RECEIVED',
            payload: {
              playerId,
              emote: payload.emote,
            },
          });
          break;
        }

        case 'LEAVE_ROOM': {
          if (currentRoomCode) {
            const room = rooms.get(currentRoomCode);
            if (room) {
              room.players.delete(playerId);
              if (room.players.size === 0) {
                rooms.delete(currentRoomCode);
              } else {
                if (room.hostId === playerId) {
                  // Reassign host
                  const nextHost = room.players.keys().next().value;
                  if (nextHost) room.hostId = nextHost;
                }
                broadcastToRoom(room, {
                  type: 'ROOM_UPDATE',
                  payload: { room: getRoomSnapshot(room), event: 'A player left the room' },
                });
              }
            }
            currentRoomCode = null;
          }
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.players.delete(playerId);
        if (room.players.size === 0) {
          rooms.delete(currentRoomCode);
        } else {
          if (room.hostId === playerId) {
            const nextHost = room.players.keys().next().value;
            if (nextHost) room.hostId = nextHost;
          }
          broadcastToRoom(room, {
            type: 'ROOM_UPDATE',
            payload: { room: getRoomSnapshot(room), event: 'A player disconnected' },
          });
        }
      }
    }
  });
});

// Setup Vite middlewares or static files
async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const fs = await import('fs');
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Neon Dash server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch(console.error);
