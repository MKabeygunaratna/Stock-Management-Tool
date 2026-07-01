const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    update: {},
    create: {
      username: ADMIN_USERNAME,
      passwordHash,
      fullName: 'Administrator',
      role: 'ADMIN',
    },
  });

  const brandNames = ['Toyota', 'Honda', 'Nissan', 'Mitsubishi'];
  const brands = {};
  for (const name of brandNames) {
    brands[name] = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const categoryNames = ['Engine', 'Brakes', 'Electrical', 'Suspension', 'Body'];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const sampleProducts = [
    {
      partNumber: 'TOY-ENG-001',
      name: 'Toyota Corolla Oil Filter',
      brand: 'Toyota',
      category: 'Engine',
      unit: 'pcs',
      costPrice: 4.5,
      sellingPrice: 8.0,
      currentStock: 40,
      reorderLevel: 10,
    },
    {
      partNumber: 'TOY-BRK-002',
      name: 'Toyota Hilux Brake Pad Set',
      brand: 'Toyota',
      category: 'Brakes',
      unit: 'set',
      costPrice: 18,
      sellingPrice: 32,
      currentStock: 15,
      reorderLevel: 5,
    },
    {
      partNumber: 'HON-ELE-001',
      name: 'Honda Civic Spark Plug',
      brand: 'Honda',
      category: 'Electrical',
      unit: 'pcs',
      costPrice: 3,
      sellingPrice: 6,
      currentStock: 60,
      reorderLevel: 20,
    },
    {
      partNumber: 'NIS-SUS-001',
      name: 'Nissan Navara Shock Absorber',
      brand: 'Nissan',
      category: 'Suspension',
      unit: 'pcs',
      costPrice: 45,
      sellingPrice: 75,
      currentStock: 8,
      reorderLevel: 4,
    },
    {
      partNumber: 'MIT-BOD-001',
      name: 'Mitsubishi Lancer Side Mirror',
      brand: 'Mitsubishi',
      category: 'Body',
      unit: 'pcs',
      costPrice: 20,
      sellingPrice: 38,
      currentStock: 3,
      reorderLevel: 5,
    },
  ];

  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { partNumber: p.partNumber },
      update: {},
      create: {
        partNumber: p.partNumber,
        name: p.name,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        currentStock: p.currentStock,
        reorderLevel: p.reorderLevel,
        brandId: brands[p.brand].id,
        categoryId: categories[p.category].id,
      },
    });
  }

  console.log('Seed complete.');
  console.log(`Default admin login -> username: ${ADMIN_USERNAME}, password: ${ADMIN_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
