import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Roles...');
  const roles = [
    { name: 'Admin', icon: 'ShieldCheck' },
    { name: 'Manager', icon: 'UserCog' },
    { name: 'Staff', icon: 'User' },
    { name: 'Accounts', icon: 'BadgeCent' },
    { name: 'Supervisor', icon: 'UserCheck' }
  ];

  for (const role of roles) {
    await prisma.roleMaster.upsert({
      where: { name: role.name },
      update: { icon: role.icon },
      create: { name: role.name, icon: role.icon }
    });
  }

  console.log('Seeding Departments...');
  const departments = [
    { name: 'Operations', icon: 'Settings' },
    { name: 'Sales', icon: 'TrendingUp' },
    { name: 'Finance', icon: 'Wallet' },
    { name: 'Housekeeping', icon: 'Home' },
    { name: 'Kitchen / F&B', icon: 'ChefHat' },
    { name: 'Maintenance', icon: 'Wrench' },
    { name: 'Laundry', icon: 'Shirt' },
    { name: 'Front Office', icon: 'Hotel' }
  ];

  for (const dept of departments) {
    await prisma.departmentMaster.upsert({
      where: { name: dept.name },
      update: { icon: dept.icon },
      create: { name: dept.name, icon: dept.icon }
    });
  }

  console.log('Master data seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
