const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, accessibleModelIds } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// GET /api/models -> modelos accesibles para el usuario
router.get('/', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  const models = await prisma.model.findMany({
    where: { id: { in: ids } },
    include: {
      assignments: { include: { user: { select: { id: true, name: true, username: true, role: true } } } },
      _count: { select: { fans: true, conversations: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(models);
});

// GET /api/models/:id
router.get('/:id', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  if (!ids.includes(req.params.id)) return res.status(403).json({ error: 'Sin acceso a esta modelo' });
  const model = await prisma.model.findUnique({
    where: { id: req.params.id },
    include: { assignments: { include: { user: { select: { id: true, name: true, username: true } } } } },
  });
  res.json(model);
});

// POST /api/models (admin/manager)
router.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const { name, alias, description, avatarUrl, socials, subPrice } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const model = await prisma.model.create({
    data: {
      name, alias, description, avatarUrl,
      socials: socials ? (typeof socials === 'string' ? socials : JSON.stringify(socials)) : null,
      subPrice: subPrice ? Number(subPrice) : 0,
    },
  });
  res.status(201).json(model);
});

// PUT /api/models/:id (admin/manager)
router.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const { name, alias, description, avatarUrl, socials, subPrice, active } = req.body;
  const data = { name, alias, description, avatarUrl, active };
  if (subPrice !== undefined) data.subPrice = Number(subPrice);
  if (socials !== undefined) data.socials = typeof socials === 'string' ? socials : JSON.stringify(socials);
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  const model = await prisma.model.update({ where: { id: req.params.id }, data });
  res.json(model);
});

// DELETE /api/models/:id (admin)
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  await prisma.model.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
