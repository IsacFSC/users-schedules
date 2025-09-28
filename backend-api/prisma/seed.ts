import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  //Add your seed data here
  Example:
  await prisma.user.create({
    data: {
      name: 'Isac',
      email: 'anadocinhodoisac@gmail.com',
      passwordHash: '$2a$12$VAbKzDzUKhalpgtLm5PCfuZcfcE5/lI0G2yDhrHM9vswH5Uj.ffYS',
      role: 'ADMIN',
    },
  });
  console.log('Database seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
