import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const statusToFlag = {
  'Pending': 0,
  'Approved': 1,
  'Rejected': 2,
  'Draft': 3,
  'Cancel': 3,
  'Received': 4
};

async function seedPos() {
  console.log('Seeding Purchase Orders from seedPos.js...');

  const employee = await prisma.employee.findFirst();
  if (!employee) {
    console.log("No employee found. Cannot seed POs. Please seed employees first.");
    return;
  }

  const sites = await prisma.site.findMany();
  const getSiteId = (name) => {
    const site = sites.find(s => s.site_name.toLowerCase() === name.toLowerCase());
    return site ? site.id : (sites[0] ? sites[0].id : 1);
  };

  const dummyRecords = [
    { po_number:'PO-POS-1008', vendor_name:'SunTech Supplies', items_description:'Cleaning Supplies x20', site_name:'OMR', expected_delivery: new Date('2026-05-01'), amount: 12400, flag: statusToFlag['Approved'] },
    { po_number:'PO-POS-1007', vendor_name:'Karthik Traders', items_description:'Bedsheets x50', site_name:'Velachery', expected_delivery: new Date('2026-04-30'), amount: 8200, flag: statusToFlag['Pending'] },
    { po_number:'PO-POS-1006', vendor_name:'CleanMart Co.', items_description:'Toiletries Kit x30', site_name:'Trichy', expected_delivery: new Date('2026-04-29'), amount: 5600, flag: statusToFlag['Received'] },
    { po_number:'PO-POS-1005', vendor_name:'Infra Build Ltd.', items_description:'Repair Materials', site_name:'Thanjavur', expected_delivery: new Date('2026-04-28'), amount: 18400, flag: statusToFlag['Draft'] },
    { po_number:'PO-POS-1004', vendor_name:'ZenCare Products', items_description:'Amenities x100', site_name:'Kutralam', expected_delivery: new Date('2026-04-27'), amount: 9800, flag: statusToFlag['Approved'] },
    { po_number:'PO-POS-1003', vendor_name:'SunTech Supplies', items_description:'Detergent Bulk x40', site_name:'OMR', expected_delivery: new Date('2026-04-26'), amount: 6500, flag: statusToFlag['Rejected'] },
    { po_number:'PO-POS-1002', vendor_name:'Karthik Traders', items_description:'Pillows x30', site_name:'Velachery', expected_delivery: new Date('2026-04-25'), amount: 7100, flag: statusToFlag['Received'] },
    { po_number:'PO-POS-1001', vendor_name:'CleanMart Co.', items_description:'Mop & Broom Set', site_name:'Trichy', expected_delivery: new Date('2026-04-24'), amount: 3200, flag: statusToFlag['Pending'] },
  ];

  for(const record of dummyRecords) {
    const site_id = getSiteId(record.site_name);
    
    // Check if PO already exists
    const existing = await prisma.purchaseOrder.findUnique({ where: { po_number: record.po_number } });
    if (existing) continue;

    await prisma.purchaseOrder.create({
      data: {
        po_number: record.po_number,
        vendor_name: record.vendor_name,
        site_id: site_id,
        remarks: record.items_description, // Put description in remarks
        total_amount: record.amount,
        expected_delivery: record.expected_delivery,
        flag: record.flag,
        created_by: employee.id
      }
    });
  }

  console.log('Purchase Orders Seeding Completed.');
}

seedPos()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
