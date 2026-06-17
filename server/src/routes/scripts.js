const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, requireRole, accessibleModelIds } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// GET /api/scripts?modelId=  -> scripts globales + de la modelo
router.get('/', async (req, res) => {
  const { modelId } = req.query;
  const where = modelId ? { OR: [{ modelId: null }, { modelId }] } : {};
  const scripts = await prisma.script.findMany({ where, orderBy: { createdAt: 'desc' } });
  res.json(scripts);
});

// POST /api/scripts (admin/manager)
router.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const { title, body, category, modelId } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Titulo y cuerpo requeridos' });
  const script = await prisma.script.create({
    data: { title, body, category: category || 'general', modelId: modelId || null },
  });
  res.status(201).json(script);
});

// PUT /api/scripts/:id (admin/manager)
router.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const { title, body, category } = req.body;
  const script = await prisma.script.update({
    where: { id: req.params.id },
    data: { title, body, category },
  });
  res.json(script);
});

// DELETE /api/scripts/:id (admin/manager)
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  await prisma.script.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
