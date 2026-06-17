const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, accessibleModelIds } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// PATCH /api/messages/:id/purchase -> marca un PPV como comprado y suma al gasto del fan
router.patch('/:id/purchase', async (req, res) => {
  const msg = await prisma.message.findUnique({
    where: { id: req.params.id },
    include: { conversation: true },
  });
  if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });

  const ids = await accessibleModelIds(req.user);
  if (!ids.includes(msg.conversation.modelId)) return res.status(403).json({ error: 'Sin acceso' });
  if (!msg.isPpv) return res.status(400).json({ error: 'No es un PPV' });

  const updated = await prisma.message.update({ where: { id: msg.id }, data: { purchased: true } });
  await prisma.fan.update({
    where: { id: msg.conversation.fanId },
    data: { totalSpent: { increment: msg.price } },
  });

  const io = req.app.get('io');
  io.to(`conv:${msg.conversationId}`).emit('message:updated', updated);
  res.json(updated);
});

module.exports = router;
