require('dotenv').config();
process.env.DATABASE_URL = process.env.DATABASE_URL.replace('localhost', '127.0.0.1');

const prisma = require('./src/lib/prisma');

prisma
  .$queryRaw`SELECT 1 AS ok`
  .then((r) => {
    console.log('DB OK', r);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error('DB ERR', e.message);
    process.exit(1);
  });
