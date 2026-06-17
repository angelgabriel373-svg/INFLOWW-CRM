const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, accessibleModelIds } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// GET /api/conversations?modelId=&q=  -> bandeja de entrada
router.get('/', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  const { modelId, q } = req.query;

  const where = { modelId: { in: ids } };
  if (modelId) {
    if (!ids.includes(modelId)) return res.status(403).json({ error: 'Sin acceso a esta modelo' });
    where.modelId = modelId;
  }
  if (q) {
    where.fan = { OR: [{ username: { contains: q } }, { name: { contains: q } }] };
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      fan: true,
      model: { select: { id: true, name: true, alias: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  res.json(
    conversations.map((c) => ({
      ...c,
      lastMessage: c.messages[0] || null,
      messages: undefined,
    }))
  );
});

// GET /api/conversations/:id -> hilo completo
router.get('/:id', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  const conv = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: {
      fan: true,
      model: { select: { id: true, name: true, alias: true, avatarUrl: true, subPrice: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sentByUser: { select: { id: true, name: true, username: true } } },
      },
    },
  });
  if (!conv || !ids.includes(conv.modelId)) return res.status(404).json({ error: 'Conversacion no encontrada' });

  // Marca como leida
  if (conv.unreadCount > 0) {
    await prisma.conversation.update({ where: { id: conv.id }, data: { unreadCount: 0 } });
  }
  res.json(conv);
});

// POST /api/conversations/:id/messages -> enviar mensaje como la MODELO
router.post('/:id/messages', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  const conv = await prisma.conversation.findUnique({ where: { id: req.params.id }, include: { fan: true } });
  if (!conv || !ids.includes(conv.modelId)) return res.status(404).json({ error: 'Conversacion no encontrada' });

  const { body, attachmentUrl, isPpv, price, scheduledFor } = req.body;
  if (!body && !attachmentUrl) return res.status(400).json({ error: 'Mensaje vacio' });

  const message = await prisma.message.create({
    data: {
      conversationId: conv.id,
      senderType: 'MODEL',
      body: body || '',
      attachmentUrl: attachmentUrl || null,
      isPpv: !!isPpv,
      price: isPpv && price ? Number(price) : 0,
      sentByUserId: req.user.id,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    },
    include: { sentByUser: { select: { id: true, name: true, username: true } } },
  });

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date() },
  });

  // Emite en tiempo real a la sala de la conversacion y a la de la modelo
  const io = req.app.get('io');
  io.to(`conv:${conv.id}`).emit('message:new', message);
  io.to(`model:${conv.modelId}`).emit('conversation:updated', { conversationId: conv.id });

  res.status(201).json(message);
});

// POST /api/conversations/:id/simulate-fan -> simula que el fan responde (demo/tester)
router.post('/:id/simulate-fan', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conv || !ids.includes(conv.modelId)) return res.status(404).json({ error: 'Conversacion no encontrada' });

  const { body } = req.body;
  const message = await prisma.message.create({
    data: { conversationId: conv.id, senderType: 'FAN', body: body || 'Mensaje del fan (simulado)' },
  });
  await prisma.conversation.update({
    where: { id: conv.id },
    data: { lastMessageAt: new Date(), unreadCount: { increment: 1 } },
  });

  const io = req.app.get('io');
  io.to(`conv:${conv.id}`).emit('message:new', message);
  io.to(`model:${conv.modelId}`).emit('conversation:updated', { conversationId: conv.id });

  res.status(201).json(message);
});

// PATCH /api/conversations/:id  -> cambiar estado / marcar compra de PPV
router.patch('/:id', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conv || !ids.includes(conv.modelId)) return res.status(404).json({ error: 'No encontrada' });
  const { status } = req.body;
  const updated = await prisma.conversation.update({
    where: { id: conv.id },
    data: { status: status || undefined },
  });
  res.json(updated);
});

module.exports = router;
