const express = require('express');
const prisma = require('../lib/prisma');
const { hashPassword } = require('../lib/auth');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

const publicUser = {
  id: true, email: true, username: true, name: true, role: true, active: true,
  shiftStart: true, shiftEnd: true, createdAt: true,
  assignments: { select: { model: { select: { id: true, name: true, alias: true } } } },
};

// GET /api/users  (admin/manager)
router.get('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: publicUser,
    orderBy: { createdAt: 'asc' },
  });
  res.json(users);
});

// POST /api/users  (admin) -> crear trabajador
router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { email, username, password, name, role, shiftStart, shiftEnd, modelIds } = req.body;
  if (!email || !username || !password || !name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const user = await prisma.user.create({
      data: {
        email, username, name,
        password: await hashPassword(password),
        role: role || 'CHATTER',
        shiftStart: shiftStart || null,
        shiftEnd: shiftEnd || null,
        assignments: modelIds && modelIds.length
          ? { create: modelIds.map((modelId) => ({ modelId })) }
          : undefined,
      },
      select: publicUser,
    });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email o usuario ya existe' });
    res.status(500).json({ error: 'Error creando usuario' });
  }
});

// PUT /api/users/:id  (admin)
router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  const { name, role, active, shiftStart, shiftEnd, password } = req.body;
  const data = { name, role, active, shiftStart, shiftEnd };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  if (password) data.password = await hashPassword(password);

  const user = await prisma.user.update({ where: { id: req.params.id }, data, select: publicUser });
  res.json(user);
});

// PUT /api/users/:id/assignments  (admin) -> reemplaza las asignaciones de modelos
router.put('/:id/assignments', requireRole('ADMIN'), async (req, res) => {
  const { modelIds = [] } = req.body;
  await prisma.modelAssignment.deleteMany({ where: { userId: req.params.id } });
  if (modelIds.length) {
    await prisma.modelAssignment.createMany({
      data: modelIds.map((modelId) => ({ userId: req.params.id, modelId })),
    });
  }
  const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: publicUser });
  res.json(user);
});

// DELETE /api/users/:id  (admin)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
