const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store presence data
const roomPresence = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a song room
    socket.on('join-song', ({ songId, user }) => {
      socket.join(`song:${songId}`);

      // Add user to presence
      if (!roomPresence.has(songId)) {
        roomPresence.set(songId, new Map());
      }
      roomPresence.get(songId).set(socket.id, user);

      // Broadcast updated presence to all in room
      const presence = Array.from(roomPresence.get(songId).values());
      io.to(`song:${songId}`).emit('presence-update', presence);

      console.log(`User ${user.name} joined song ${songId}`);
    });

    // Leave a song room
    socket.on('leave-song', ({ songId }) => {
      socket.leave(`song:${songId}`);

      if (roomPresence.has(songId)) {
        roomPresence.get(songId).delete(socket.id);
        const presence = Array.from(roomPresence.get(songId).values());
        io.to(`song:${songId}`).emit('presence-update', presence);
      }
    });

    // Song updates
    socket.on('song-update', ({ songId, updates }) => {
      socket.to(`song:${songId}`).emit('song-updated', updates);
    });

    // Track updates
    socket.on('track-update', ({ songId, trackId, updates }) => {
      socket.to(`song:${songId}`).emit('track-updated', { trackId, updates });
    });

    // Track created
    socket.on('track-created', ({ songId, track }) => {
      socket.to(`song:${songId}`).emit('track-created', track);
    });

    // Track deleted
    socket.on('track-deleted', ({ songId, trackId }) => {
      socket.to(`song:${songId}`).emit('track-deleted', trackId);
    });

    // Note created
    socket.on('note-created', ({ songId, trackId, note }) => {
      socket.to(`song:${songId}`).emit('note-created', { trackId, note });
    });

    // Note deleted
    socket.on('note-deleted', ({ songId, trackId, noteId }) => {
      socket.to(`song:${songId}`).emit('note-deleted', { trackId, noteId });
    });

    // Chat message
    socket.on('chat-message', ({ songId, message }) => {
      io.to(`song:${songId}`).emit('chat-message', message);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      // Remove from all rooms
      roomPresence.forEach((users, songId) => {
        if (users.has(socket.id)) {
          users.delete(socket.id);
          const presence = Array.from(users.values());
          io.to(`song:${songId}`).emit('presence-update', presence);
        }
      });
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server running`);
    });
});
