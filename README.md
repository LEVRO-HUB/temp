# Chippy Residency ERP — Phase 2 Deployment Guide

## Project Overview

Chippy Residency ERP is a full-stack property management system for hotel/service-apartment chains.
Built with **React + Vite** (frontend), **Node.js + Express** (backend), **Prisma ORM**, and **PostgreSQL via Supabase**.

---

## Architecture

```
chippy_erp/
├── chippy_erp_backend/
│   ├── prisma/schema.prisma      Prisma data model
│   └── src/
│       ├── config/prisma.js      Prisma client singleton
│       ├── controllers/          Business logic
│       ├── middleware/            Auth (JWT)
│       ├── routes/               Express routers
│       └── server.js             Entry point
│
└── chippy_erp_frontend/
    └── src/
        ├── pages/                Full-page components
        ├── layouts/              DashboardLayout (sidebar, nav)
        ├── components/           Shared UI (Pagination, etc.)
        └── utils/                Helpers (CSV export)
```

---

## Phase 1 — What Was Delivered (already deployed)

Phase 1 hardened the booking system with conflict prevention, a full status lifecycle, and room rate management.

### DB / Schema changes

| Addition | Detail |
|---|---|
| `BookingStatus` enum | `confirmed`, `checked_in`, `checked_out`, `cancelled` |
| `Booking.status` | Default `confirmed` |
| `Booking.actual_check_in` | Timestamp set when status → `checked_in` |
| `Booking.actual_check_out` | Timestamp set when status → `checked_out` |
| `Booking.rate_per_night` | Snapshot of room rate at booking time |
| `Booking.remarks` | Free-text notes |
| `Room.rate_per_night` | Nightly rate for auto-total calculation |

### New API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/bookings/available-rooms` | Returns rooms free for `?site_id=X&check_in=Y&check_out=Z` |
| `PATCH` | `/api/bookings/:id/status` | Enforced FSM status transition |
| `DELETE` | `/api/bookings/:id` | Soft delete — frees room if needed |
| `PUT` | `/api/rooms/:id` | Edit room rate, status, type |
| `GET` | `/api/bookings/gantt` | Rooms + bookings for a date window (used by Gantt) |

### Booking status FSM

```
confirmed ──► checked_in ──► checked_out  (terminal)
    │               │
    └───────────────┴──► cancelled         (terminal)
```

Room status syncs automatically on every transition.

### Frontend (SalesBooking.jsx)

- Live availability room dropdown (filtered by site + dates)
- Auto-calculate total from `rate_per_night × nights`
- Colour-coded status pills
- Check In / Check Out / Cancel buttons per row
- Confirm dialogs for all status changes
- Status filter in the list view
- Booking summary strip in the create form

---

## Phase 2A — What Was Delivered (this release)

Phase 2A adds the **Gantt timeline calendar** — an Airbnb/hotel-style room occupancy view.

### Files added / changed

| File | Path | Action |
|---|---|---|
| `GanttPage.jsx` | `chippy_erp_frontend/src/pages/GanttPage.jsx` | **NEW** — page wrapper, fetches sites, renders Gantt |
| `BookingGantt.jsx` | `chippy_erp_frontend/src/pages/BookingGantt.jsx` | **NEW** — the full Gantt component |
| `App.jsx` | `chippy_erp_frontend/src/App.jsx` | Added `/booking-calendar` route |
| `DashboardLayout.jsx` | `chippy_erp_frontend/src/layouts/DashboardLayout.jsx` | Added **Booking Calendar** to SALES sidebar section |
| `SalesBooking.jsx` | `chippy_erp_frontend/src/pages/SalesBooking.jsx` | Added **Calendar View** toggle button; `prefilledCheckIn` support from Gantt |

### Gantt features

- **Rooms as rows** — all active rooms for the selected site
- **Dates as columns** — scrollable; 2-week / 3-week / 1-month / 2-month window options
- **Colour-coded booking bars** — Blue (Confirmed), Green (Checked In), Grey (Checked Out), Red (Cancelled)
- **Partial-window bars** — flat edges when a booking extends past the visible window
- **Today highlight** — vertical blue line + column tint
- **Weekend shading** — subtle background on Sat/Sun
- **Month grouping** — sub-header row shows the month label
- **Click a bar** → booking detail popup (guest, dates, amount, status, action buttons)
- **Click an empty cell** → navigates to `/bookings` with room + check-in date pre-filled in the form
- **Check In / Check Out / Cancel** from the popup (calls `PATCH /api/bookings/:id/status`)
- **Room summary strip** — total / available / occupied / maintenance count at the bottom
- **Site selector** — switch sites without leaving the page
- **Navigation** — prev/next 7-day shift, Today button, window-size selector
- **List View button** → back to `/bookings` list
- **New Booking button** → opens create form

---

## Step-by-step deployment — Phase 2A

### Step 1 — No DB migration needed

Phase 2A is entirely frontend. The Gantt API endpoint (`GET /api/bookings/gantt`) was already added in Phase 1.

### Step 2 — Copy new files into your repo

```
GanttPage.jsx       →  chippy_erp_frontend/src/pages/GanttPage.jsx     (new)
BookingGantt.jsx    →  chippy_erp_frontend/src/pages/BookingGantt.jsx  (new)
```

And replace these existing files with the updated versions:

```
App.jsx             →  chippy_erp_frontend/src/App.jsx
DashboardLayout.jsx →  chippy_erp_frontend/src/layouts/DashboardLayout.jsx
SalesBooking.jsx    →  chippy_erp_frontend/src/pages/SalesBooking.jsx
```

### Step 3 — Rebuild frontend

Dev:
```bash
cd chippy_erp_frontend
npm run dev        # hot-reload auto-picks up changes
```

Production:
```bash
npm run build
```

### Step 4 — Verify in browser

1. Log in → sidebar SALES section should show **Booking Calendar**
2. Click it → Gantt loads at `/booking-calendar`
3. Click a booking bar → detail popup opens
4. Click Check In on a `confirmed` booking → status updates, bar turns green
5. Click an empty cell → redirected to `/bookings` with room + date pre-filled

---

## Coming — Phase 2B: Dedicated Check-In Screen

Planned scope:
- Arrival time picker
- ID type selector (Aadhaar / Passport / Driving Licence / Other)
- ID number capture
- Guest count confirmation
- Remarks field
- Calls `PATCH /api/bookings/:id/status` → `checked_in`

**DB migration needed (Phase 2B):**

```sql
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "id_type"      TEXT,
  ADD COLUMN IF NOT EXISTS "id_number"    TEXT,
  ADD COLUMN IF NOT EXISTS "arrival_time" TIMESTAMPTZ;
```

```prisma
// schema.prisma additions
model Booking {
  ...
  id_type       String?
  id_number     String?
  arrival_time  DateTime?
}
```

---

## Coming — Phase 2C: Dedicated Check-Out Screen

Planned scope:
- Stay summary (room, actual dates, nights)
- Payment summary (charged vs received vs outstanding)
- Final remarks
- Calls `PATCH /api/bookings/:id/status` → `checked_out`

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend `.env` | Supabase pooled connection string |
| `DIRECT_URL` | Backend `.env` | Supabase direct connection (Prisma generates) |
| `JWT_SECRET` | Backend `.env` | JWT signing secret |
| `VITE_API_URL` | Frontend `.env` | Backend base URL e.g. `https://api.yoursite.com` |

---

## Running locally

```bash
# Backend
cd chippy_erp_backend
npm install
npx prisma generate
npm run dev            # :5000

# Frontend (separate terminal)
cd chippy_erp_frontend
npm install
npm run dev            # :5173
```

---

## RBAC — module access

**Booking Calendar** reuses the `bookings` module key, so any role with `can_view` on bookings can access it automatically.

To give it its own permission row:
```sql
INSERT INTO "ModuleMaster" (module_name, module_key, route_path, sidebar_icon, sort_order)
VALUES ('Booking Calendar', 'booking_calendar', '/booking-calendar', 'CalendarDays', 5);
```
Then grant the role in the RBAC screen (Roles → Edit Permissions).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons |
| Backend | Node.js, Express 5, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Auth | JWT Bearer token, role-based permissions |
| Deployment | Cloudflare Pages (frontend), EC2 / Node host (backend) |
