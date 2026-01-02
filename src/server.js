import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import PokerGame from './engine/PokerGame.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

const rooms = new Map();

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new PokerGame(roomId, io));
    }
    const game = rooms.get(roomId);
    const player = game.addPlayer(socket.id, username);
    io.to(roomId).emit('game_state', game.getPublicState());
  });

  socket.on('action', ({ roomId, action, amount }) => {
    const game = rooms.get(roomId);
    if (game) {
      game.handleAction(socket.id, action, amount);
      io.to(roomId).emit('game_state', game.getPublicState());
    }
  });

  socket.on('disconnect', () => {
    rooms.forEach((game, roomId) => {
      game.removePlayer(socket.id);
      io.to(roomId).emit('game_state', game.getPublicState());
    });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Rialo Protocol Active on port ${PORT}`);
});
