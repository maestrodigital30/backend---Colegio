const { PrismaClient } = require('@prisma/client');

const TIMEZONE = process.env.TZ || 'America/Lima';
process.env.TZ = TIMEZONE;

const globalForPrisma = globalThis;

const prisma = globalForPrisma.__prismaClient || new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
});

if (!globalForPrisma.__prismaClient) {
  globalForPrisma.__prismaClient = prisma;

  prisma.$connect()
    .then(() => prisma.$executeRawUnsafe(`SET TIME ZONE '${TIMEZONE}'`))
    .catch((err) => console.error('Error inicializando Prisma:', err));
}

module.exports = prisma;
