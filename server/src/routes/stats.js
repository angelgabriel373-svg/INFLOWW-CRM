const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, accessibleModelIds } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);

// GET /api/stats/overview -> KPIs globales + por modelo + por chatter
router.get('/overview', async (req, res) => {
  const ids = await accessibleModelIds(req.user);

  const [models, users, conversations, ppvSent, ppvBought] = await Promise.all([
    prisma.model.findMany({ where: { id: { in: ids } } }),
    prisma.user.count({ where: { active: true } }),
    prisma.conversation.count({ where: { modelId: { in: ids } } }),
    prisma.message.count({ where: { isPpv: true, conversation: { modelId: { in: ids } } } }),
    prisma.message.findMany({
      where: { isPpv: true, purchased: true, conversation: { modelId: { in: ids } } },
      select: { price: true },
    }),
  ]);

  const totalRevenue = ppvBought.reduce((s, m) => s + m.price, 0);
  const conversionRate = ppvSent ? Math.round((ppvBought.length / ppvSent) * 100) : 0;

  // Revenue por modelo (suma de PPV comprados + gasto acumulado de fans)
  const revenueByModel = [];
  for (const m of models) {
    const bought = await prisma.message.findMany({
      where: { isPpv: true, purchased: true, conversation: { modelId: m.id } },
      select: { price: true },
    });
    const fansSpent = await prisma.fan.aggregate({
      where: { modelId: m.id },
      _sum: { totalSpent: true },
    });
    const msgCount = await prisma.message.count({
      where: { senderType: 'MODEL', conversation: { modelId: m.id } },
    });
    revenueByModel.push({
      modelId: m.id,
      name: m.alias || m.name,
      ppvRevenue: bought.reduce((s, x) => s + x.price, 0),
      fansRevenue: fansSpent._sum.totalSpent || 0,
      messagesSent: msgCount,
    });
  }

  // Mensajes por chatter (de la modelo, enviados por trabajadores)
  const messagesByChatter = await prisma.message.groupBy({
    by: ['sentByUserId'],
    where: { senderType: 'MODEL', sentByUserId: { not: null }, conversation: { modelId: { in: ids } } },
    _count: { _all: true },
  });
  const chatterIds = messagesByChatter.map((m) => m.sentByUserId);
  const chatters = await prisma.user.findMany({
    where: { id: { in: chatterIds } },
    select: { id: true, name: true },
  });
  const chatterMap = Object.fromEntries(chatters.map((c) => [c.id, c.name]));
  const byChatter = messagesByChatter.map((m) => ({
    name: chatterMap[m.sentByUserId] || 'Desconocido',
    messages: m._count._all,
  }));

  res.json({
    kpis: {
      models: models.length,
      activeUsers: users,
      conversations,
      ppvSent,
      ppvBought: ppvBought.length,
      conversionRate,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
    revenueByModel,
    messagesByChatter: byChatter,
  });
});

module.exports = router;
