/**
 * Receptor del puente OnlyFans -> dashboard.
 * El conector (local) manda aqui las conversaciones reales leidas de OnlyFans.
 * Autenticacion por clave fija (cabecera x-sync-key === SYNC_API_KEY), para no
 * tener que meter la contrasena de admin en el conector.
 */
const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

function checkKey(req, res, next) {
  const key = req.headers['x-sync-key'];
  if (!process.env.SYNC_API_KEY || key !== process.env.SYNC_API_KEY) {
    return res.status(401).json({ error: 'Clave de sync invalida' });
  }
  next();
}

// POST /api/sync/onlyfans  { model: "marta", conversations: [...] }
router.post('/onlyfans', checkKey, async (req, res) => {
  const { model: modelName, conversations = [] } = req.body;
  if (!modelName) return res.status(400).json({ error: 'Falta el nombre de modelo' });

  const model = await prisma.model.findFirst({
    where: { name: { equals: modelName, mode: 'insensitive' } },
  });
  if (!model) return res.status(404).json({ error: `Modelo "${modelName}" no existe en el CRM` });

  let upserted = 0;
  for (const c of conversations) {
    if (!c.username) continue;

    // Fan (upsert manual por modelId + username)
    let fan = await prisma.fan.findFirst({ where: { modelId: model.id, username: c.username } });
    fan = fan
      ? await prisma.fan.update({ where: { id: fan.id }, data: { name: c.name || fan.name, avatarUrl: c.avatarUrl || fan.avatarUrl } })
      : await prisma.fan.create({ data: { modelId: model.id, username: c.username, name: c.name || c.username, avatarUrl: c.avatarUrl || null } });

    // Conversacion (upsert por modelId + fanId)
    let conv = await prisma.conversation.findFirst({ where: { modelId: model.id, fanId: fan.id } });
    const lastAt = c.lastMessageAt ? new Date(c.lastMessageAt) : new Date();
    conv = conv
      ? await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: lastAt, unreadCount: c.unreadCount || 0 } })
      : await prisma.conversation.create({ data: { modelId: model.id, fanId: fan.id, lastMessageAt: lastAt, unreadCount: c.unreadCount || 0 } });

    // Historial completo: cada mensaje se inserta una sola vez (dedupe por extId de OnlyFans)
    const msgs = Array.isArray(c.messages) && c.messages.length
      ? c.messages
      : (c.lastMessageText ? [{ extId: null, senderType: c.lastFromFan ? 'FAN' : 'MODEL', body: c.lastMessageText, createdAt: c.lastMessageAt }] : []);

    for (const m of msgs) {
      if (!m.body) continue;
      if (m.extId) {
        const exists = await prisma.message.findUnique({ where: { extId: String(m.extId) } });
        if (exists) continue;
      }
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          extId: m.extId ? String(m.extId) : null,
          senderType: m.senderType === 'FAN' ? 'FAN' : 'MODEL',
          body: m.body,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        },
      });
    }
    upserted++;
  }

  res.json({ ok: true, model: model.name, synced: upserted });
});

module.exports = router;
