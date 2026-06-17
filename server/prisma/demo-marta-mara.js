// Crea conversaciones de ejemplo para Marta y Mara (para practicar/probar el panel).
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = await prisma.model.findMany({ where: { name: { in: ['Marta', 'Mara'] } } });

  const fans = [
    { username: 'mike_88', name: 'Mike', spent: 120, notes: 'Fan nuevo, le gusta el trato cercano.' },
    { username: 'carlos_vip', name: 'Carlos', spent: 450, notes: 'Compra packs caros. Tratar como VIP.' },
    { username: 'david_r', name: 'David', spent: 0, notes: 'Fan frio, no ha comprado todavia.' },
  ];

  const thread = [
    { who: 'FAN', body: 'Hola guapa, acabo de suscribirme 😍' },
    { who: 'MODEL', body: 'Heey amor 😏 que ganas tenia de hablar contigo... cuentame, que te gusta?' },
    { who: 'FAN', body: 'Me encanta tu contenido, eres preciosa' },
    { who: 'MODEL', body: 'Tengo un PPV nuevo que creo que te va a encantar 🙈 quieres verlo?' },
  ];

  for (const model of models) {
    for (const f of fans) {
      const fan = await prisma.fan.create({
        data: { modelId: model.id, username: `${f.username}_${model.name.toLowerCase()}`, name: f.name, totalSpent: f.spent, notes: f.notes },
      });
      const conv = await prisma.conversation.create({
        data: { modelId: model.id, fanId: fan.id, unreadCount: f.username === 'david_r' ? 1 : 0 },
      });
      for (const m of thread) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderType: m.who,
            body: m.body,
            isPpv: m.body.includes('PPV'),
            price: m.body.includes('PPV') ? 20 : 0,
          },
        });
      }
    }
    console.log(`✅ Conversaciones de ejemplo creadas para ${model.name}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
