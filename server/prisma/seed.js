/**
 * Seed de la base de datos.
 * Crea: admin, manager, chatters, modelos, fans, conversaciones, mensajes y scripts.
 * Credenciales de prueba al final del script (se imprimen en consola).
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Limpiando base de datos...');
  // Orden por dependencias
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.fan.deleteMany();
  await prisma.script.deleteMany();
  await prisma.modelAssignment.deleteMany();
  await prisma.workSession.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.model.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  console.log('👤 Creando usuarios...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ofm.com',
      username: 'admin',
      password: hash('admin123'),
      name: 'Angel (Admin)',
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@ofm.com',
      username: 'salvador',
      password: hash('manager123'),
      name: 'Salvador (Team Leader)',
      role: 'MANAGER',
      shiftStart: '12:00',
      shiftEnd: '20:00',
    },
  });

  const chatter1 = await prisma.user.create({
    data: {
      email: 'giovanni@ofm.com',
      username: 'giovanni',
      password: hash('chatter123'),
      name: 'Giovanni',
      role: 'CHATTER',
      shiftStart: '12:00',
      shiftEnd: '20:00',
    },
  });

  const chatter2 = await prisma.user.create({
    data: {
      email: 'luis@ofm.com',
      username: 'luis',
      password: hash('chatter123'),
      name: 'Luis',
      role: 'CHATTER',
      shiftStart: '12:00',
      shiftEnd: '20:00',
    },
  });

  console.log('💃 Creando modelos...');
  const modelsData = [
    {
      name: 'Sara Anquela',
      alias: 'Sara',
      description: 'Valladolid/Madrid, 37 anios, secretaria/funcionaria.',
      subPrice: 9.99,
      socials: JSON.stringify({ instagram: '@saraanquela', onlyfans: 'saraanquela', telegram: '@saravip' }),
    },
    {
      name: 'Olivia Gold',
      alias: 'Olivia',
      description: 'Barcelona, 22 anios, modelo/estudiante.',
      subPrice: 12.99,
      socials: JSON.stringify({ instagram: '@oliviagold', onlyfans: 'oliviagold', telegram: '@oliviavip' }),
    },
    {
      name: 'Valeria Linde',
      alias: 'Valeria',
      description: 'Madrid, 21 anios, estudiante de enfermeria.',
      subPrice: 8.99,
      socials: JSON.stringify({ instagram: '@valerialinde', onlyfans: 'valerialinde', telegram: '@valeriavip' }),
    },
  ];

  const models = [];
  for (const m of modelsData) {
    models.push(await prisma.model.create({ data: m }));
  }
  const [sara, olivia, valeria] = models;

  console.log('🔗 Asignando chatters a modelos...');
  // Giovanni -> Sara y Olivia ; Luis -> Valeria ; Manager ve todas las suyas
  await prisma.modelAssignment.createMany({
    data: [
      { userId: chatter1.id, modelId: sara.id },
      { userId: chatter1.id, modelId: olivia.id },
      { userId: chatter2.id, modelId: valeria.id },
      { userId: manager.id, modelId: sara.id },
      { userId: manager.id, modelId: olivia.id },
      { userId: manager.id, modelId: valeria.id },
    ],
  });

  console.log('📝 Creando scripts (respuestas rapidas)...');
  await prisma.script.createMany({
    data: [
      { title: 'Bienvenida', body: 'Heey amor 😏 que ganas tenia de hablar contigo... cuentame, que te gusta?', category: 'apertura', modelId: null },
      { title: 'Reactivar fan frio', body: 'Te he echado de menos 🥺 tengo algo nuevo que creo que te va a encantar...', category: 'reactivacion', modelId: null },
      { title: 'Cierre por escasez', body: 'Solo lo tengo disponible hoy, manana lo borro. Te lo mando?', category: 'cierre', modelId: null },
      { title: 'Upsell PPV', body: 'Esto es lo mas atrevido que he grabado nunca 🔥 quieres verlo en privado?', category: 'upsell', modelId: null },
      { title: 'Sara - tono cercano', body: 'Aqui tu secretaria favorita... hoy he sido muy mala en la oficina 😈', category: 'apertura', modelId: sara.id },
    ],
  });

  console.log('🧑‍🤝‍🧑 Creando fans y conversaciones...');
  const fanNames = [
    { username: 'mike_88', name: 'Mike', spent: 240 },
    { username: 'carlos_vip', name: 'Carlos', spent: 530 },
    { username: 'john_d', name: 'John', spent: 90 },
    { username: 'pedro_m', name: 'Pedro', spent: 1200 },
    { username: 'alex_r', name: 'Alex', spent: 60 },
  ];

  const sampleFanMsgs = [
    'Hola guapa, llevo siguiendote un tiempo',
    'Que precio tiene el pack?',
    'Me encanta tu contenido 🔥',
    'Estas conectada?',
    'Quiero algo mas personal...',
  ];
  const sampleModelMsgs = [
    'Heey amor 😏 justo pensaba en ti',
    'Tengo un PPV nuevo que te va a encantar 🙈',
    'Solo para mis fans mas especiales como tu 💋',
    'Te lo mando al privado ahora mismo?',
    'Eres de mis favoritos, te cuento un secreto...',
  ];

  for (const model of models) {
    for (let i = 0; i < fanNames.length; i++) {
      const f = fanNames[i];
      const fan = await prisma.fan.create({
        data: {
          modelId: model.id,
          username: `${f.username}_${model.alias.toLowerCase()}`,
          name: f.name,
          totalSpent: f.spent,
          notes: i % 2 === 0 ? 'Fan fiel, le gusta el trato cercano.' : 'Compra packs caros.',
        },
      });

      const conv = await prisma.conversation.create({
        data: {
          modelId: model.id,
          fanId: fan.id,
          unreadCount: i % 3 === 0 ? 2 : 0,
        },
      });

      // Hilo de mensajes alternando fan/modelo
      const total = 4 + (i % 3);
      for (let j = 0; j < total; j++) {
        const isFan = j % 2 === 0;
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderType: isFan ? 'FAN' : 'MODEL',
            body: isFan ? sampleFanMsgs[(i + j) % sampleFanMsgs.length] : sampleModelMsgs[(i + j) % sampleModelMsgs.length],
            sentByUserId: isFan ? null : chatter1.id,
            isPpv: !isFan && j === total - 1,
            price: !isFan && j === total - 1 ? 25 : 0,
            purchased: !isFan && j === total - 1 && i % 2 === 0,
          },
        });
      }

      await prisma.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: new Date(Date.now() - i * 3600 * 1000) },
      });
    }
  }

  console.log('🎫 Creando tickets de ejemplo...');
  await prisma.ticket.create({
    data: {
      title: 'Fan reporta cobro duplicado',
      body: 'El fan carlos_vip dice que se le cobro dos veces el PPV de 25e.',
      createdById: chatter1.id,
      status: 'OPEN',
    },
  });

  console.log('\n✅ Seed completado. Credenciales de acceso:');
  console.table([
    { rol: 'ADMIN', usuario: 'admin', password: 'admin123' },
    { rol: 'MANAGER', usuario: 'salvador', password: 'manager123' },
    { rol: 'CHATTER', usuario: 'giovanni', password: 'chatter123' },
    { rol: 'CHATTER', usuario: 'luis', password: 'chatter123' },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
