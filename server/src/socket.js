const { verifyToken } = require('./lib/auth');

// Configura Socket.io: autentica por token y gestiona salas por conversacion/modelo.
function setupSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No autenticado'));
      socket.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Token invalido'));
    }
  });

  io.on('connection', (socket) => {
    // Unirse a la sala de una conversacion para recibir mensajes en vivo
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Unirse a la sala de una modelo (para refrescar la bandeja)
    socket.on('model:join', (modelId) => {
      socket.join(`model:${modelId}`);
    });

    // Indicador "escribiendo..."
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit('typing', { user: socket.user.name, isTyping });
    });
  });
}

module.exports = { setupSocket };
