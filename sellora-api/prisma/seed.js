// Seeds a handful of product categories so the storefront/catalog isn't empty.
// Run with: npm run seed  (after `npx prisma migrate deploy`)
const prisma = require('../src/lib/prisma');

const categories = [
  { name: 'Groceries', slug: 'groceries' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Apparel', slug: 'apparel' },
  { name: 'Tools', slug: 'tools' },
  { name: 'Wellness', slug: 'wellness' },
];

async function main() {
  for (const c of categories) {
    await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
