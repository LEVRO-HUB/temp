import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.employee.findUnique({ where: { email: 'admin@chippy.com' } });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('admin123', salt);
    await prisma.employee.create({
      data: {
        name: 'Super Admin',
        email: 'admin@chippy.com',
        mobile_number: '9999999999',
        role: 'admin',
        password_hash,
        is_active: true,
        login_enabled: true
      }
    });
    console.log('Seeded default admin user: admin@chippy.com / admin123');
  } else {
    console.log('Admin user already exists.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
