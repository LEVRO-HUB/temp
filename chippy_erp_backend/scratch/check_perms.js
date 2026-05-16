import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const perms = await prisma.rolePermission.findMany({
    include: { role: true, module: true }
  });
  console.log(JSON.stringify(perms, null, 2));
}

check().finally(() => prisma.$disconnect());
