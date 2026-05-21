-- ============================================================
-- RBAC Seed — ModuleMaster + RolePermission
-- Run this in Supabase SQL editor ONCE
-- Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================

-- ── 1. Ensure unique constraint exists on module_key ─────────
ALTER TABLE "ModuleMaster"
  ADD CONSTRAINT IF NOT EXISTS "ModuleMaster_module_key_key" UNIQUE (module_key);

-- ── 2. Insert all modules ────────────────────────────────────
INSERT INTO "ModuleMaster" (module_name, module_key, route_path, sidebar_icon, sort_order, status)
VALUES
  ('Dashboard',         'dashboard',        '/dashboard',          'LayoutDashboard', 1,  true),
  ('Sales Enquiries',   'enquiries',        '/enquiries',          'Users',           2,  true),
  ('Bookings & Sales',  'bookings',         '/bookings',           'Box',             3,  true),
  ('Booking Calendar',  'booking_calendar', '/booking-calendar',   'CalendarDays',    4,  true),
  ('Booking Reports',   'booking_reports',  '/booking-reports',    'BarChart3',       5,  true),
  ('Payments',          'payments',         '/payments',           'CreditCard',      6,  true),
  ('Purchase Orders',   'pos',              '/purchase-orders',    'ShoppingCart',    7,  true),
  ('Rooms & Units',     'rooms',            '/rooms',              'Box',             8,  true),
  ('Zones & Sites',     'zones',            '/sites',              'Map',             9,  true),
  ('Employees',         'employees',        '/employees',          'UserCircle',      10, true),
  ('Screen Rights',     'rbac',             '/rbac',               'ShieldCheck',     11, true),
  ('Profile Settings',  'profile',          '/profile',            'UserCircle',      12, true)
ON CONFLICT (module_key) DO UPDATE SET
  module_name = EXCLUDED.module_name,
  route_path  = EXCLUDED.route_path,
  sort_order  = EXCLUDED.sort_order;

-- ── 3. Ensure unique constraint on RolePermission ───────────
ALTER TABLE "RolePermission"
  ADD CONSTRAINT IF NOT EXISTS "RolePermission_role_id_module_id_key"
  UNIQUE (role_id, module_id);

-- ── 4. Grant SUPER ADMIN full access to all modules ─────────
-- (Assumes Super Admin role id=1 — adjust if different)
INSERT INTO "RolePermission" (role_id, module_id, can_view, can_add, can_edit, can_delete)
SELECT
  1 AS role_id,
  m.id AS module_id,
  true AS can_view,
  true AS can_add,
  true AS can_edit,
  true AS can_delete
FROM "ModuleMaster" m
ON CONFLICT (role_id, module_id) DO UPDATE SET
  can_view   = true,
  can_add    = true,
  can_edit   = true,
  can_delete = true;

-- ── 5. Verify ────────────────────────────────────────────────
SELECT m.module_key, m.module_name, m.sort_order,
       rp.can_view, rp.can_add, rp.can_edit, rp.can_delete
FROM "ModuleMaster" m
LEFT JOIN "RolePermission" rp ON rp.module_id = m.id AND rp.role_id = 1
ORDER BY m.sort_order;
