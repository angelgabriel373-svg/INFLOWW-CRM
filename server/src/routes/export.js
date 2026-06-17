const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, accessibleModelIds } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/export/conversations/:id.csv
router.get('/conversations/:id.csv', async (req, res) => {
  const ids = await accessibleModelIds(req.user);
  const conv = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: {
      fan: true,
      model: true,
      messages: { orderBy: { createdAt: 'asc' }, include: { sentByUser: true } },
    },
  });
  if (!conv || !ids.includes(conv.modelId)) return res.status(404).json({ error: 'No encontrada' });

  const rows = [['fecha', 'emisor', 'enviado_por', 'mensaje', 'ppv', 'precio', 'comprado']];
  for (const m of conv.messages) {
    rows.push([
      m.createdAt.toISOString(),
      m.senderType === 'FAN' ? `FAN (${conv.fan.username})` : `MODELO (${conv.model.name})`,
      m.sentByUser ? m.sentByUser.name : '',
      m.body,
      m.isPpv ? 'si' : 'no',
      m.price,
      m.purchased ? 'si' : 'no',
    ]);
  }
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="conversacion-${conv.fan.username}.csv"`);
  res.send('﻿' + csv);
});

module.exports = router;
