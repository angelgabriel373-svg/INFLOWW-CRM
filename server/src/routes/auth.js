const express = require('express');
const prisma = require('../lib/prisma');
const { signToken, comparePassword } = require('../lib/auth');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/login  { identifier, password }  (identifier = email o username)
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Usuario y contrasenia requeridos' });
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });
  if (!user || !user.active) return res.status(401).json({ error: 'Credenciales invalidas' });

  const ok = await comparePassword(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });

  // Abre una sesion de trabajo
  await prisma.workSession.create({ data: { userId: user.id } });

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, username: true, email: true, role: true, shiftStart: true, shiftEnd: true },
  });
  res.json({ user });
});

// POST /api/auth/logout  -> cierra la sesion de trabajo abierta
router.post('/logout', authenticate, async (req, res) => {
  const open = await prisma.workSession.findFirst({
    where: { userId: req.user.id, endedAt: null },
    orderBy: { startedAt: 'desc' },
  });
  if (open) {
    await prisma.workSession.update({ where: { id: open.id }, data: { endedAt: new Date() } });
  }
  res.json({ ok: true });
});

module.exports = router;
