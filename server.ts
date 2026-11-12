import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', onlinePlayers: wss.clients.size, roomsCount: rooms.size });
});

// Rooms Management
interface RoomPlayer {
  id: string;
  ws: WebSocket;
  character: 'mario' | 'luigi';
  name: string;
}

interface Room {
  id: string;
  hostId: string;
  players: Map<string, RoomPlayer>;
  created: number;
}

const rooms = new Map<string, Room>();

// WebSocket Server
const wss = new WebSocketServer({ server, path: '/ws' });

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let playerId = Math.random().toString(36).substring(2, 9);

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'CREATE_ROOM') {
        const roomId = msg.customCode ? msg.customCode.toUpperCase().trim() : generateRoomCode();
        const preferredRole = msg.character === 'luigi' ? 'luigi' : 'mario';

        const room: Room = {
          id: roomId,
          hostId: playerId,
          players: new Map(),
          created: Date.now(),
        };

        room.players.set(playerId, {
          id: playerId,
          ws,
          character: preferredRole,
          name: msg.name || (preferredRole === 'mario' ? 'Mario' : 'Luigi'),
        });

        rooms.set(roomId, room);
        currentRoomId = roomId;

        ws.send(JSON.stringify({
          type: 'ROOM_CREATED',
          roomId,
          playerId,
          character: preferredRole,
          playerCount: 1,
        }));
      } else if (msg.type === 'JOIN_ROOM') {
        const roomId = (msg.roomId || '').toUpperCase().trim();
        const room = rooms.get(roomId);

        if (!room) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Sala não encontrada! Verifique o código.' }));
          return;
        }

        if (room.players.size >= 2) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Esta sala já está cheia (2 jogadores).' }));
          return;
        }

        // Determine joining character: opposite of host
        let hostChar: 'mario' | 'luigi' = 'mario';
        for (const p of room.players.values()) {
          hostChar = p.character;
        }
        const joiningChar = hostChar === 'mario' ? 'luigi' : 'mario';

        room.players.set(playerId, {
          id: playerId,
          ws,
          character: joiningChar,
          name: msg.name || (joiningChar === 'mario' ? 'Mario' : 'Luigi'),
        });

        currentRoomId = roomId;

        // Confirm to joiner
        ws.send(JSON.stringify({
          type: 'ROOM_JOINED',
          roomId,
          playerId,
          character: joiningChar,
          playerCount: 2,
        }));

        // Broadcast to all players in room that match is ready!
        for (const player of room.players.values()) {
          player.ws.send(JSON.stringify({
            type: 'MATCH_START',
            roomId,
            players: Array.from(room.players.values()).map((p) => ({
              id: p.id,
              name: p.name,
              character: p.character,
            })),
          }));
        }
      } else if (msg.type === 'PLAYER_SYNC') {
        // Relay position, speed and animation frame to the other player in the room
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        for (const [id, player] of room.players) {
          if (id !== playerId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify({
              type: 'PEER_SYNC',
              character: msg.character,
              x: msg.x,
              y: msg.y,
              vx: msg.vx,
              vy: msg.vy,
              facing: msg.facing,
              isGrounded: msg.isGrounded,
              isJumping: msg.isJumping,
              runFrame: msg.runFrame,
              currentPlatformIndex: msg.currentPlatformIndex,
            }));
          }
        }
      } else if (msg.type === 'MATH_TRIGGER' || msg.type === 'MATH_SOLVED' || msg.type === 'PLAYER_FELL' || msg.type === 'BOSS_EVENT') {
        // Broadcast game events to room
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        for (const [id, player] of room.players) {
          if (id !== playerId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(JSON.stringify(msg));
          }
        }
      }
    } catch (e) {
      console.error('WS Message parsing error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players.delete(playerId);
        if (room.players.size === 0) {
          rooms.delete(currentRoomId);
        } else {
          // Notify peer
          for (const player of room.players.values()) {
            if (player.ws.readyState === WebSocket.OPEN) {
              player.ws.send(JSON.stringify({ type: 'PEER_DISCONNECTED', message: 'O outro jogador se desconectou.' }));
            }
          }
        }
      }
    }
  });
});

// Vite Middleware in Dev vs Static files in Prod
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer();
