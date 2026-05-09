import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const [enquiries, bookings, employees, sites] = await Promise.all([
      prisma.enquiry.count(),
      prisma.booking.count(),
      prisma.employee.count(),
      prisma.site.count()
    ]);
    console.log('Enquiries:', enquiries);
    console.log('Bookings:', bookings);
    console.log('Employees:', employees);
    console.log('Sites:', sites);
  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
