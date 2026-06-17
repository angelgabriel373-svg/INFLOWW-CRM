/**
 * Siembra la BD solo si esta vacia (no hay usuarios). Se usa al arrancar
 * en el servidor para no borrar datos en cada despliegue.
 */
const { PrismaClient } = require('@prisma/client');
const { seedProd } = require('./seed-prod');

async function main() {
  const prisma = new PrismaClient();
  try {
    const count = await prisma.user.count();
    if (count > 0) {
      console.log(`ℹ️  BD ya tiene ${count} usuarios, no se siembra.`);
      return;
    }
    console.log('🌱 BD vacia: sembrando estado inicial...');
    await seedProd(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
