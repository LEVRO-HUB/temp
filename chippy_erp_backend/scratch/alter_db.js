import prisma from '../src/config/prisma.js';
async function run() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Enquiry" ALTER COLUMN "room_type_requested" TYPE TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Room" ALTER COLUMN "room_type" TYPE TEXT;`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "RoomType" CASCADE;`);
    console.log("SQL execution successful.");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
