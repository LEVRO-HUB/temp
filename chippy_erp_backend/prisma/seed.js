import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Seed RoleMaster
  const roles = [
    { name: 'Super Admin', icon: 'ShieldCheck' },
    { name: 'Admin', icon: 'UserCog' },
    { name: 'Manager', icon: 'UserCheck' },
    { name: 'Employee', icon: 'User' },
    { name: 'Developer', icon: 'Code' },
  ];

  for (const role of roles) {
    await prisma.roleMaster.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('Roles seeded.');

  // 2. Seed DepartmentMaster
  const depts = [
    { name: 'Front Office', icon: 'Layout' },
    { name: 'Housekeeping', icon: 'Home' },
    { name: 'F&B / Kitchen', icon: 'Utensils' },
    { name: 'Maintenance', icon: 'Wrench' },
    { name: 'Engineering', icon: 'Settings' },
    { name: 'Accounts', icon: 'Calculator' },
    { name: 'IT Support', icon: 'Cpu' },
  ];

  for (const dept of depts) {
    await prisma.departmentMaster.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log('Departments seeded.');

  // 3. Seed ModuleMaster
  const modules = [
    { module_name: 'Dashboard', module_key: 'dashboard', route_path: '/dashboard', sidebar_icon: 'LayoutDashboard', sort_order: 1 },
    { module_name: 'Employee Management', module_key: 'employees', route_path: '/employees', sidebar_icon: 'Users', sort_order: 2 },
    { module_name: 'Zones & Sites', module_key: 'zones', route_path: '/zones', sidebar_icon: 'Map', sort_order: 3 },
    { module_name: 'Room Management', module_key: 'rooms', route_path: '/rooms', sidebar_icon: 'BedDouble', sort_order: 4 },
    { module_name: 'Sales Enquiry', module_key: 'enquiries', route_path: '/enquiries', sidebar_icon: 'PhoneCall', sort_order: 5 },
    { module_name: 'Sales Booking', module_key: 'bookings', route_path: '/bookings', sidebar_icon: 'CalendarCheck', sort_order: 6 },
    { module_name: 'Payment Module', module_key: 'payments', route_path: '/payments', sidebar_icon: 'CreditCard', sort_order: 7 },
    { module_name: 'Purchase Orders', module_key: 'pos', route_path: '/purchase-orders', sidebar_icon: 'ShoppingBag', sort_order: 8 },
    { module_name: 'Screen Rights', module_key: 'rbac', route_path: '/rbac', sidebar_icon: 'ShieldCheck', sort_order: 9 },
  ];

  for (const mod of modules) {
    await prisma.moduleMaster.upsert({
      where: { module_key: mod.module_key },
      update: mod,
      create: mod,
    });
  }
  console.log('Modules seeded.');

  // 4. Create Super Admin User
  const superAdminRole = await prisma.roleMaster.findUnique({ where: { name: 'Super Admin' } });
  const hashedPassword = await bcrypt.hash('Chippy@erp26', 10);

  const admin = await prisma.employee.upsert({
    where: { email: 'admin@chippy.com' },
    update: {
        role_id: superAdminRole.id,
        login_enabled: true
    },
    create: {
      name: 'Super Admin',
      mobile_number: '9876543210',
      email: 'admin@chippy.com',
      password_hash: hashedPassword,
      is_active: true,
      login_enabled: true,
      role_id: superAdminRole.id,
    },
  });

  console.log('Super Admin created:', admin.email);

  // 5. Grant all permissions to Super Admin role
  const allModules = await prisma.moduleMaster.findMany();
  for (const mod of allModules) {
    await prisma.rolePermission.upsert({
      where: { role_id_module_id: { role_id: superAdminRole.id, module_id: mod.id } },
      update: { can_view: true, can_add: true, can_edit: true, can_delete: true },
      create: { role_id: superAdminRole.id, module_id: mod.id, can_view: true, can_add: true, can_edit: true, can_delete: true },
    });
  }
  console.log('Super Admin permissions granted.');

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
