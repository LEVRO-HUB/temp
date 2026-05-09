import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Restoring master data...');
    
    // 1. Create Zone
    const chennai = await prisma.zone.create({
      data: { zone_name: 'Chennai', zone_code: 'CHN' }
    });
    
    const sitesData = [
      { site_name: 'Velachery', location: 'Velachery, Chennai', site_type: 'hotel', total_rooms: 10, flat_number: 'V-01' },
      { site_name: 'OMR', location: 'OMR, Chennai', site_type: 'service_apartment', total_rooms: 15, flat_number: 'O-01' },
      { site_name: 'Trichy', location: 'Trichy, Tamil Nadu', site_type: 'hotel', total_rooms: 8, flat_number: 'T-01' },
      { site_name: 'Kutralam', location: 'Kutralam, Tamil Nadu', site_type: 'hotel', total_rooms: 5, flat_number: 'K-01' },
      { site_name: 'Thanjavur', location: 'Thanjavur, Tamil Nadu', site_type: 'hotel', total_rooms: 6, flat_number: 'TJ-01' }
    ];

    for (const s of sitesData) {
      const site = await prisma.site.create({
        data: {
          ...s,
          zone_id: chennai.id
        }
      });
      
      // Create some rooms for each site
      await prisma.room.create({
        data: {
          site_id: site.id,
          room_number: `${s.flat_number.split('-')[0]}-101`,
          room_type: 'Standard',
          status: 'available'
        }
      });
      await prisma.room.create({
        data: {
          site_id: site.id,
          room_number: `${s.flat_number.split('-')[0]}-102`,
          room_type: '1 BHK',
          status: 'available'
        }
      });
    }

    console.log('Master data (Zones, Sites, Rooms) restored successfully!');
  } catch (error) {
    console.error('Error restoring master data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
