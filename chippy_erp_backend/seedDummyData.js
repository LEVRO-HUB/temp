import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedData() {
  console.log('Fetching existing dependencies...');
  const admin = await prisma.employee.findFirst({ where: { role: 'admin' } });
  if (!admin) throw new Error('No admin found to map records to');
  
  const sites = await prisma.site.findMany();
  if (sites.length === 0) throw new Error('No sites found. Please create sites first.');

  const getSiteId = (name) => {
    const site = sites.find(s => s.site_name.toLowerCase() === name.toLowerCase());
    return site ? site.id : sites[0].id;
  };

  const rooms = await prisma.room.findMany();
  if (rooms.length === 0) throw new Error('No rooms found.');

  // Dummy Enquiries
  const recentEnquiries = [
    { guest_name: 'Arun Kumar', mobile: '9003658519', site: 'Velachery', status: 'new', source: 'Phone Call' },
    { guest_name: 'Priya Raj', mobile: '9940287745', site: 'OMR', status: 'follow-up', source: 'Walk-In' },
    { guest_name: 'Ramkumar', mobile: '9176637721', site: 'Trichy', status: 'converted', source: 'Online' },
    { guest_name: 'Vijay', mobile: '8765123345', site: 'Kutralam', status: 'new', source: 'Phone Call' },
    { guest_name: 'Deepak', mobile: '9087654321', site: 'Thanjavur', status: 'lost', source: 'Online' },
    { guest_name: 'Sara', mobile: '9081122334', site: 'Velachery', status: 'new', source: 'Walk-In' },
    { guest_name: 'Naveen', mobile: '9911223344', site: 'OMR', status: 'converted', source: 'Online' },
    { guest_name: 'Preethi', mobile: '8811223344', site: 'Trichy', status: 'follow-up', source: 'Phone Call' }
  ];

  console.log('Inserting dummy Enquiries...');
  for (const eq of recentEnquiries) {
    await prisma.enquiry.create({
      data: {
        guest_name: eq.guest_name,
        mobile_number: eq.mobile,
        site_id: getSiteId(eq.site),
        room_type_requested: 'Standard',
        check_in_date: new Date('2026-05-10T00:00:00.000Z'),
        no_of_days: 2,
        enquiry_source: eq.source,
        status: eq.status,
        created_by: admin.id
      }
    });
  }

  // Dummy Bookings
  const recentBookings = [
    { guest_name: 'Ram', site: 'Velachery', check_in: '2026-04-30T00:00:00.000Z', amount: 2600 },
    { guest_name: 'Suresh', site: 'OMR', check_in: '2026-04-30T00:00:00.000Z', amount: 3800 },
    { guest_name: 'Meena', site: 'Trichy', check_in: '2026-04-29T00:00:00.000Z', amount: 2200 },
    { guest_name: 'Karthik', site: 'Kutralam', check_in: '2026-04-29T00:00:00.000Z', amount: 1900 },
    { guest_name: 'Raj', site: 'Thanjavur', check_in: '2026-04-28T00:00:00.000Z', amount: 2100 },
    { guest_name: 'Surya', site: 'OMR', check_in: '2026-04-28T00:00:00.000Z', amount: 3100 },
    { guest_name: 'Divya', site: 'Velachery', check_in: '2026-04-27T00:00:00.000Z', amount: 2800 },
    { guest_name: 'Guna', site: 'Trichy', check_in: '2026-04-27T00:00:00.000Z', amount: 2500 }
  ];

  console.log('Inserting dummy Bookings and Payments...');
  for (const bkg of recentBookings) {
    const checkIn = new Date(bkg.check_in);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2); // 2 nights

    const siteId = getSiteId(bkg.site);
    const room = rooms.find(r => r.site_id === siteId) || rooms[0];

    const booking = await prisma.booking.create({
      data: {
        site_id: siteId,
        room_id: room.id,
        booking_type: 'walk-in',
        guest_name: bkg.guest_name,
        guest_count: 2,
        mobile_number: '9876543210',
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_nights: 2,
        total_amount: bkg.amount,
        booking_date: checkIn,
        created_by: admin.id
      }
    });

    // Insert payment for the booking
    await prisma.payment.create({
      data: {
         payment_date: checkIn,
         payment_no: `PAY-${10000 + booking.id}`,
         transaction_type: 'receipt',
         type_of_method: 'card',
         payment_type: 'full',
         sub_total_in_forex: bkg.amount,
         tax_amt_in_forex: 0,
         payment_amt_in_forex: bkg.amount,
         payment_amt_in_base: bkg.amount,
         site_id: siteId,
         booking_id: booking.id,
         created_by_id: admin.id
      }
    });
  }

  // Dummy Purchase Orders
  const purchaseOrders = [
    { vendor: 'Kitchen Supplies Ltd', dept: 'F&B / Kitchen', amount: 54000, priority: 'Urgent', items: [{ desc: 'Premium Chef Knives', qty: 5, up: 8000 }, { desc: 'Industrial Blender', qty: 2, up: 7000 }] },
    { vendor: 'CleanStay Solutions', dept: 'Housekeeping', amount: 25000, priority: 'Normal', items: [{ desc: 'Standard Guest Towels', qty: 100, up: 250 }] },
    { vendor: 'General Electric', dept: 'Maintenance', amount: 125000, priority: 'Normal', items: [{ desc: 'Air Conditioning Units', qty: 5, up: 25000 }] },
    { vendor: 'Stationery World', dept: 'Front Office', amount: 4500, priority: 'Low', items: [{ desc: 'A4 Paper Reams', qty: 50, up: 90 }] },
    { vendor: 'Dairy Fresh', dept: 'F&B / Kitchen', amount: 8200, priority: 'Normal', items: [{ desc: 'Unsalted Butter (5kg)', qty: 4, up: 2050 }] },
  ];

  console.log('Inserting dummy Purchase Orders...');
  for (let i = 0; i < purchaseOrders.length; i++) {
    const po = purchaseOrders[i];
    await prisma.purchaseOrder.create({
      data: {
        po_number: `PO-2026-${1001 + i}`,
        vendor_name: po.vendor,
        department: po.dept,
        date: new Date(),
        priority: po.priority,
        total_amount: po.amount,
        site_id: sites[0].id,
        created_by: admin.id,
        flag: i % 2 === 0 ? 1 : 0, // Mix of Pending and Approved
        items: {
          create: po.items.map(it => ({
            description: it.desc,
            quantity: it.qty,
            unit_price: it.up,
            total_price: it.qty * it.up,
            unit: 'Units'
          }))
        }
      }
    });
  }

  console.log('Dummy data successfully seeded!');
}

seedData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
