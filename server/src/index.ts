import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { PokerEngine } from './core/engine';

dotenv.config();

const port = process.env.PORT || 4000;
const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

const engines: Record<string, PokerEngine> = {};

async function saveGameState(roomId: string, engine: PokerEngine) {
    const state = engine.getState();
    await redisClient.set(`room:${roomId}`, JSON.stringify(state));
}

async function loadGameState(roomId: string): Promise<PokerEngine | null> {
    const data = await redisClient.get(`room:${roomId}`);
    if (data) {
        const state = JSON.parse(data);
        const engine = new PokerEngine(roomId);
        // A real senior app would have an 'inflate' method to restore state properly
        // For now, let's use the local memory as cache and redis as backup
        return engine;
    }
    return null;
}

async function startServer() {
  await redisClient.connect();
  console.log('Connected to Redis');

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', async (data) => {
        try {
            const { roomId, name } = data;
            console.log(`Join Room Request: ${roomId} from ${name}`);
            socket.join(roomId);
            if (!engines[roomId]) {
                engines[roomId] = new PokerEngine(roomId);
            }
            
            const engine = engines[roomId];
            if (engine.addPlayer(socket.id, name)) {
                await saveGameState(roomId, engine);
                io.to(roomId).emit('game_update', engine.getState());
            } else {
                socket.emit('error', 'Room full or game already started');
            }
        } catch (err) {
            console.error('Join Room Error:', err);
        }
    });

    socket.on('start_game', async (data) => {
        try {
            const { roomId } = data || {};
            console.log(`Start Game Request: ${roomId}`);
            if (!roomId || !engines[roomId]) {
                return socket.emit('error', 'Invalid room identifier');
            }
            const engine = engines[roomId];
            if (engine && engine.startGame()) {
                await saveGameState(roomId, engine);
                io.to(roomId).emit('game_update', engine.getState());
            }
        } catch (err) {
            console.error('Start Game Error:', err);
        }
    });

    socket.on('action', async (data) => {
        try {
            const { roomId, type, amount } = data || {};
            console.log(`Action Request: ${type} in ${roomId}`);
            if (!roomId || !engines[roomId]) {
                return socket.emit('error', 'Session synchronized failed - please re-join');
            }
            const engine = engines[roomId];
            if (engine && engine.action(socket.id, type, amount)) {
                await saveGameState(roomId, engine);
                io.to(roomId).emit('game_update', engine.getState());
            }
        } catch (err) {
            console.error('Action Error:', err);
        }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // In a real app, don't remove immediately. Set an 'away' flag for reconnection.
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer();
