import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  //Add your seed data here
  Example:
  await prisma.user.create({
    data: {
      name: 'teste',
      email: 'teste',
      passwordHash: 'teste',
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
