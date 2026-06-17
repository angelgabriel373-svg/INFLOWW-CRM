/**
 * Seed de PRODUCCION (estado real): Angel (admin) + Juki (chatter),
 * modelos Marta y Mara, Juki asignado a ambas, scripts base y unas
 * conversaciones de ejemplo para practicar.
 *
 * Contrasenas desde variables de entorno (recomendado en el servidor):
 *   ADMIN_PASSWORD, JUKI_PASSWORD  (si no se ponen, usa unas por defecto).
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function seedProd(prisma) {
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const adminPw = process.env.ADMIN_PASSWORD || 'admin123';
  const jukiPw = process.env.JUKI_PASSWORD || 'juki123';

  const admin = await prisma.user.create({
    data: { email: 'angelgabriel373@gmail.com', username: 'admin', password: hash(adminPw), name: 'Angel (Admin)', role: 'ADMIN' },
  });

  const juki = await prisma.user.create({
    data: { email: 'juki@ofm.com', username: 'juki', password: hash(jukiPw), name: 'Juki', role: 'CHATTER' },
  });

  const marta = await prisma.model.create({
    data: { name: 'Marta', alias: 'Marta', description: 'Modelo OFM. Comision 50%. Email de cuenta: marta19919ruben@gmail.com', subPrice: 9.99,
      socials: JSON.stringify({ email: 'marta19919ruben@gmail.com', onlyfans: '', instagram: '', telegram: '' }) },
  });
  const mara = await prisma.model.create({
    data: { name: 'Mara', alias: 'Mara', description: 'Modelo OFM. Email de cuenta: mariadelmaronly@gmail.com', subPrice: 9.99,
      socials: JSON.stringify({ email: 'mariadelmaronly@gmail.com', onlyfans: 'mariadelmaronly', instagram: '', telegram: '' }) },
  });

  await prisma.modelAssignment.createMany({
    data: [
      { userId: juki.id, modelId: marta.id },
      { userId: juki.id, modelId: mara.id },
    ],
  });

  await prisma.script.createMany({
    data: [
      { title: 'Bienvenida', body: 'Heey amor 😏 que ganas tenia de hablar contigo... cuentame, que te gusta?', category: 'apertura', modelId: null },
      { title: 'Reactivar fan frio', body: 'Te he echado de menos 🥺 tengo algo nuevo que creo que te va a encantar...', category: 'reactivacion', modelId: null },
      { title: 'Cierre por escasez', body: 'Solo lo tengo disponible hoy, manana lo borro. Te lo mando?', category: 'cierre', modelId: null },
      { title: 'Upsell PPV', body: 'Esto es lo mas atrevido que he grabado nunca 🔥 quieres verlo en privado?', category: 'upsell', modelId: null },
    ],
  });

  // Conversaciones de ejemplo para practicar
  const fans = [
    { username: 'mike_88', name: 'Mike', spent: 120, notes: 'Fan nuevo, trato cercano.' },
    { username: 'carlos_vip', name: 'Carlos', spent: 450, notes: 'VIP, compra packs caros.' },
    { username: 'david_r', name: 'David', spent: 0, notes: 'Fan frio, no ha comprado.' },
  ];
  const thread = [
    { who: 'FAN', body: 'Hola guapa, acabo de suscribirme 😍' },
    { who: 'MODEL', body: 'Heey amor 😏 cuentame, que te gusta?' },
    { who: 'FAN', body: 'Me encanta tu contenido' },
    { who: 'MODEL', body: 'Tengo un PPV nuevo que te va a encantar 🙈 quieres verlo?' },
  ];
  for (const model of [marta, mara]) {
    for (const f of fans) {
      const fan = await prisma.fan.create({
        data: { modelId: model.id, username: `${f.username}_${model.name.toLowerCase()}`, name: f.name, totalSpent: f.spent, notes: f.notes },
      });
      const conv = await prisma.conversation.create({
        data: { modelId: model.id, fanId: fan.id, unreadCount: f.username === 'david_r' ? 1 : 0 },
      });
      for (const m of thread) {
        await prisma.message.create({
          data: { conversationId: conv.id, senderType: m.who, body: m.body, isPpv: m.body.includes('PPV'), price: m.body.includes('PPV') ? 20 : 0 },
        });
      }
    }
  }

  console.log('✅ Seed de produccion completado (Angel + Juki, Marta + Mara).');
}

module.exports = { seedProd };

// Permite ejecutarlo directamente: node prisma/seed-prod.js
if (require.main === module) {
  const prisma = new PrismaClient();
  seedProd(prisma)
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
