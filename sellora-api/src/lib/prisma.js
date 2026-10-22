// Prisma client bootstrap (CommonJS)
// Lazily creates the Prisma client on first real use.

let prismaInstance;

function getPrisma() {
  if (prismaInstance) return prismaInstance;

  if (global.__prisma) {
    prismaInstance = global.__prisma;
    return prismaInstance;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and fill it in (see README).'
    );
  }

  const { PrismaClient } = require('@prisma/client');
  prismaInstance = new PrismaClient();

  if (process.env.NODE_ENV !== 'production') global.__prisma = prismaInstance;
  return prismaInstance;
}

// Proxy so existing call sites (`prisma.user.findUnique(...)`) keep working
// while the real client is only instantiated on first use.
const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      return getPrisma()[prop];
    },
  }
);

module.exports = prisma;
