import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
  const enquiriesCount = await prisma.enquiry.count();
  const bookingsCount = await prisma.booking.count();
  const sitesCount = await prisma.site.count();
  const roomsCount = await prisma.room.count();
  const paymentsCount = await prisma.payment.count();

  console.log(`Database Counts:`);
  console.log(`Sites: ${sitesCount}`);
  console.log(`Rooms: ${roomsCount}`);
  console.log(`Enquiries: ${enquiriesCount}`);
  console.log(`Bookings: ${bookingsCount}`);
  console.log(`Payments: ${paymentsCount}`);

  if (bookingsCount > 0) {
    const recentBooking = await prisma.booking.findFirst({
        orderBy: { id: 'desc' },
        include: { site: true, room: true }
    });
    console.log(`Latest Booking:`, recentBooking);
  }
}

checkDb()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
