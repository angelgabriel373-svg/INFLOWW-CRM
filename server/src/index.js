require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

// En desarrollo se usa CLIENT_URL (http://localhost:5173).
// En produccion, si no se define, se refleja el origen de la peticion
// (el frontend se sirve desde el mismo dominio), asi el chat funciona sin
// tener que saber la URL del servidor de antemano.
const CLIENT_URL = process.env.CLIENT_URL;
const corsOrigin = CLIENT_URL ? CLIENT_URL : true;
const PORT = process.env.PORT || 4000;

const io = new Server(server, { cors: { origin: corsOrigin, methods: ['GET', 'POST'], credentials: true } });
app.set('io', io);
setupSocket(io);

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '5mb' }));

// Archivos subidos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rutas de la API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/models', require('./routes/models'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/scripts', require('./routes/scripts'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/export', require('./routes/export'));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Servir el frontend compilado en produccion (build de Vite)
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => err && next());
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

server.listen(PORT, () => {
  console.log(`\n🚀 API + WebSocket en puerto ${PORT}`);
  console.log(`   CORS: ${CLIENT_URL || 'cualquier origen (mismo dominio)'}`);
});
