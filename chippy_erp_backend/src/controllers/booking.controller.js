import prisma from '../config/prisma.js';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/**
 * Check if a room has any ACTIVE (confirmed or checked_in) bookings
 * that overlap with the requested date range.
 * Excludes a specific booking ID when updating.
 */
const hasConflict = async (room_id, check_in_date, check_out_date, excludeBookingId = null) => {
  const where = {
    room_id: parseInt(room_id),
    status: { in: ['confirmed', 'checked_in'] },
    is_deleted: false,
    // Overlap condition: existing booking starts before new checkout AND ends after new checkin
    check_in_date:  { lt: new Date(check_out_date) },
    check_out_date: { gt: new Date(check_in_date) },
  };
  if (excludeBookingId) {
    where.id = { not: parseInt(excludeBookingId) };
  }
  const conflict = await prisma.booking.findFirst({ where });
  return !!conflict;
};

const bookingInclude = {
  site:     true,
  room:     true,
  employee: { select: { id: true, name: true } },
  enquiry:  { select: { id: true, guest_name: true } },
};

// ─────────────────────────────────────────────
// GET ALL BOOKINGS (paginated, filtered)
// ─────────────────────────────────────────────
export const getBookings = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const skip   = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';        // filter by BookingStatus
    const site_id = req.query.site_id || '';

    const where = { is_deleted: false };

    if (status)  where.status  = status;
    if (site_id) where.site_id = parseInt(site_id);

    if (search) {
      where.OR = [
        { guest_name:    { contains: search, mode: 'insensitive' } },
        { mobile_number: { contains: search, mode: 'insensitive' } },
        { place:         { contains: search, mode: 'insensitive' } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include:  bookingInclude,
        orderBy:  { booking_date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({ data: bookings, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('getBookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// GET /api/bookings/report?from=YYYY-MM-DD&to=YYYY-MM-DD&site_id=X
export const getBookingReport = async (req, res) => {
  try {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultTo = today;

    const fromDate = req.query.from ? new Date(req.query.from) : defaultFrom;
    const toDate = req.query.to ? new Date(req.query.to) : defaultTo;
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999); // end of day — fixes timezone mismatch with Supabase UTC timestamps

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid from/to date' });
    }
    if (toDate < fromDate) {
      return res.status(400).json({ error: 'to must be on or after from' });
    }

    const toExclusive = new Date(toDate.getTime() + 1); // 1ms past end-of-day
    const days = Math.max(1, Math.ceil((toExclusive - fromDate) / 86400000));
    const siteId = req.query.site_id ? parseInt(req.query.site_id) : null;

    const bookingWhere = {
      is_deleted: false,
      check_in_date: { lt: toExclusive },
      check_out_date: { gt: fromDate },
      ...(siteId && { site_id: siteId }),
    };
    const [bookings, rooms, sites] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        include: bookingInclude,
        orderBy: [{ check_in_date: 'asc' }, { id: 'asc' }],
      }),
      prisma.room.findMany({
        where: {
          is_active: true,
          ...(siteId && { site_id: siteId }),
        },
        select: { id: true, site_id: true },
      }),
      prisma.site.findMany({
        where: {
          is_active: true,
          ...(siteId && { id: siteId }),
        },
        orderBy: { site_name: 'asc' },
        select: { id: true, site_name: true },
      }),
    ]);
    const roomCount = rooms.length;
    const roomCountBySite = new Map();
    for (const room of rooms) {
      roomCountBySite.set(room.site_id, (roomCountBySite.get(room.site_id) || 0) + 1);
    }

    const statusCounts = {
      confirmed: 0,
      checked_in: 0,
      checked_out: 0,
      cancelled: 0,
    };
    const revenueBySiteMap = new Map();
    const siteOccupancyMap = new Map();
    for (const site of sites) {
      revenueBySiteMap.set(site.id, { site_id: site.id, site: site.site_name, revenue: 0, bookings: 0 });
      siteOccupancyMap.set(site.id, { site_id: site.id, site: site.site_name, occupiedRoomNights: 0 });
    }

    let totalRevenue = 0;
    let occupiedRoomNights = 0;

    for (const b of bookings) {
      if (statusCounts[b.status] !== undefined) statusCounts[b.status] += 1;

      if (b.status !== 'cancelled') {
        const revenue = Number(b.total_amount || 0);
        totalRevenue += revenue;
        const siteSummary = revenueBySiteMap.get(b.site_id) || {
          site_id: b.site_id,
          site: b.site?.site_name || 'Unknown',
          revenue: 0,
          bookings: 0,
        };
        siteSummary.revenue += revenue;
        siteSummary.bookings += 1;
        revenueBySiteMap.set(b.site_id, siteSummary);

        const start = new Date(Math.max(new Date(b.check_in_date).getTime(), fromDate.getTime()));
        const end = new Date(Math.min(new Date(b.check_out_date).getTime(), toExclusive.getTime()));
        const clippedNights = Math.max(0, Math.ceil((end - start) / 86400000));
        occupiedRoomNights += clippedNights;

        const occupancy = siteOccupancyMap.get(b.site_id) || {
          site_id: b.site_id,
          site: b.site?.site_name || 'Unknown',
          occupiedRoomNights: 0,
        };
        occupancy.occupiedRoomNights += clippedNights;
        siteOccupancyMap.set(b.site_id, occupancy);
      }
    }

    const totalRoomNights = roomCount * days;
    const occupancyRate = totalRoomNights === 0
      ? 0
      : parseFloat(((occupiedRoomNights / totalRoomNights) * 100).toFixed(1));

    res.json({
      from: fromDate.toISOString().split('T')[0],
      to: toDate.toISOString().split('T')[0],
      days,
      summary: {
        totalBookings: bookings.length,
        totalRevenue,
        activeRooms: roomCount,
        totalRoomNights,
        occupiedRoomNights,
        occupancyRate,
      },
      statusCounts,
      revenueBySite: Array.from(revenueBySiteMap.values())
        .filter(s => s.revenue > 0 || s.bookings > 0)
        .sort((a, b) => b.revenue - a.revenue),
      occupancyBySite: Array.from(siteOccupancyMap.values())
        .map(s => {
          const siteRoomNights = (roomCountBySite.get(s.site_id) || 0) * days;
          return {
            ...s,
            totalRoomNights: siteRoomNights,
            occupancyRate: siteRoomNights === 0 ? 0 : parseFloat(((s.occupiedRoomNights / siteRoomNights) * 100).toFixed(1)),
          };
        })
        .filter(s => s.totalRoomNights > 0 || s.occupiedRoomNights > 0),
      bookings: bookings.map(b => ({
        id: b.id,
        booking_no: `BKG-${10000 + b.id}`,
        guest_name: b.guest_name,
        mobile_number: b.mobile_number,
        site: b.site?.site_name || 'N/A',
        room: b.room?.room_number || 'N/A',
        room_type: b.room?.room_type || 'N/A',
        check_in_date: b.check_in_date,
        check_out_date: b.check_out_date,
        total_nights: b.total_nights,
        status: b.status,
        total_amount: Number(b.total_amount || 0),
      })),
    });
  } catch (error) {
    console.error('getBookingReport error:', error);
    res.status(500).json({ error: 'Failed to fetch booking report' });
  }
};

// ─────────────────────────────────────────────
// GET AVAILABLE ROOMS for a date range + site
// GET /api/bookings/available-rooms?site_id=X&check_in=Y&check_out=Z
// ─────────────────────────────────────────────
export const getAvailableRooms = async (req, res) => {
  try {
    const { site_id, check_in, check_out } = req.query;

    if (!site_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'site_id, check_in and check_out are required' });
    }

    const inDate  = new Date(check_in);
    const outDate = new Date(check_out);

    if (outDate <= inDate) {
      return res.status(400).json({ error: 'check_out must be after check_in' });
    }

    // Rooms that have an active booking overlapping the requested window
    const occupiedRoomIds = await prisma.booking.findMany({
      where: {
        site_id:        parseInt(site_id),
        is_deleted:     false,
        status:         { in: ['confirmed', 'checked_in'] },
        check_in_date:  { lt: outDate },
        check_out_date: { gt: inDate },
      },
      select: { room_id: true },
    });

    const occupiedIds = occupiedRoomIds.map(b => b.room_id);

    const availableRooms = await prisma.room.findMany({
      where: {
        site_id:   parseInt(site_id),
        is_active: true,
        status:    { not: 'maintenance' },
        id:        { notIn: occupiedIds },
      },
      include: { site: { select: { site_name: true } } },
    });

    res.json(availableRooms);
  } catch (error) {
    console.error('getAvailableRooms error:', error);
    res.status(500).json({ error: 'Failed to fetch available rooms' });
  }
};

// ─────────────────────────────────────────────
// CREATE BOOKING
// ─────────────────────────────────────────────
export const createBooking = async (req, res) => {
  try {
    const {
      enquiry_id, site_id, room_id, booking_type,
      guest_name, guest_count, mobile_number, place,
      check_in_date, check_out_date, rate_per_night, total_amount, remarks,
    } = req.body;

    if (!room_id || !check_in_date || !check_out_date) {
      return res.status(400).json({ error: 'room_id, check_in_date and check_out_date are required' });
    }

    const inDate  = new Date(check_in_date);
    const outDate = new Date(check_out_date);

    if (outDate <= inDate) {
      return res.status(400).json({ error: 'check_out_date must be after check_in_date' });
    }

    // ✅ Conflict check — prevent double booking
    const conflict = await hasConflict(room_id, check_in_date, check_out_date);
    if (conflict) {
      return res.status(409).json({
        error: 'This room is already booked for the selected dates. Please choose a different room or dates.',
      });
    }

    // Fetch room to get rate_per_night
    const room = await prisma.room.findUnique({ where: { id: parseInt(room_id) } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const total_nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));

    const suppliedRate = rate_per_night !== undefined && rate_per_night !== '' ? parseFloat(rate_per_night) : null;
    const snapshotRate = suppliedRate ?? (room.rate_per_night ? parseFloat(room.rate_per_night) : null);
    const computedAmount = total_amount !== undefined && total_amount !== ''
      ? parseFloat(total_amount)
      : snapshotRate ? snapshotRate * total_nights : 0;

    const booking = await prisma.booking.create({
      data: {
        enquiry_id:     enquiry_id ? parseInt(enquiry_id) : null,
        site_id:        parseInt(site_id) || room.site_id,
        room_id:        parseInt(room_id),
        booking_type:   booking_type || 'walk_in',
        status:         'confirmed',
        guest_name,
        guest_count:    parseInt(guest_count) || 1,
        mobile_number,
        place,
        check_in_date:  inDate,
        check_out_date: outDate,
        total_nights,
        rate_per_night: snapshotRate,
        total_amount:   computedAmount,
        remarks:        remarks || null,
        created_by:     req.user.id,
      },
      include: bookingInclude,
    });

    // Mark the linked enquiry as converted
    if (enquiry_id) {
      await prisma.enquiry.update({
        where: { id: parseInt(enquiry_id) },
        data:  { status: 'converted' },
      });
    }

    // ✅ Update room status to occupied
    await prisma.room.update({
      where: { id: parseInt(room_id) },
      data:  { status: 'occupied' },
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// ─────────────────────────────────────────────
// GET SINGLE BOOKING BY ID
// GET /api/bookings/:id
// ─────────────────────────────────────────────
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where:   { id: parseInt(id), is_deleted: false },
      include: bookingInclude,
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// ─────────────────────────────────────────────
// UPDATE BOOKING (edit guest/dates/room)
// ─────────────────────────────────────────────
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      enquiry_id, site_id, room_id, booking_type,
      guest_name, guest_count, mobile_number, place,
      check_in_date, check_out_date, rate_per_night, total_amount, remarks,
    } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });
    if (existing.status === 'checked_out' || existing.status === 'cancelled') {
      return res.status(400).json({ error: `Cannot edit a booking with status: ${existing.status}` });
    }

    const newRoomId    = room_id        ? parseInt(room_id)  : existing.room_id;
    const newCheckIn   = check_in_date  ? new Date(check_in_date)  : existing.check_in_date;
    const newCheckOut  = check_out_date ? new Date(check_out_date) : existing.check_out_date;

    if (newCheckOut <= newCheckIn) {
      return res.status(400).json({ error: 'check_out_date must be after check_in_date' });
    }

    // ✅ Conflict check (exclude current booking)
    const conflict = await hasConflict(newRoomId, newCheckIn, newCheckOut, id);
    if (conflict) {
      return res.status(409).json({
        error: 'This room is already booked for the selected dates.',
      });
    }

    const total_nights = Math.ceil((newCheckOut - newCheckIn) / (1000 * 60 * 60 * 24));

    const suppliedRate = rate_per_night !== undefined && rate_per_night !== '' ? parseFloat(rate_per_night) : null;
    let newRate = suppliedRate ?? (existing.rate_per_night ? parseFloat(existing.rate_per_night) : null);

    // Recalculate rate/total if room changed
    let newTotal = total_amount ? parseFloat(total_amount) : parseFloat(existing.total_amount);
    if (room_id && newRoomId !== existing.room_id) {
      const newRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
      if (newRoom?.rate_per_night) {
        newRate = suppliedRate ?? parseFloat(newRoom.rate_per_night);
        if (!total_amount) newTotal = newRate * total_nights;
      }
    } else if (!total_amount && suppliedRate) {
      newTotal = suppliedRate * total_nights;
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: {
        ...(enquiry_id    !== undefined && { enquiry_id: enquiry_id ? parseInt(enquiry_id) : null }),
        ...(site_id       && { site_id:    parseInt(site_id) }),
        ...(room_id       && { room_id:    newRoomId }),
        ...(booking_type  && { booking_type }),
        ...(guest_name    && { guest_name }),
        ...(guest_count   && { guest_count: parseInt(guest_count) }),
        ...(mobile_number && { mobile_number }),
        ...(place         !== undefined && { place }),
        ...(remarks       !== undefined && { remarks }),
        check_in_date:  newCheckIn,
        check_out_date: newCheckOut,
        total_nights,
        rate_per_night: newRate,
        total_amount: newTotal,
      },
      include: bookingInclude,
    });

    res.json(booking);
  } catch (error) {
    console.error('updateBooking error:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// ─────────────────────────────────────────────
// UPDATE BOOKING STATUS
// PATCH /api/bookings/:id/status
// body: { status: 'checked_in' | 'checked_out' | 'cancelled', actual_time?: ISO string }
// ─────────────────────────────────────────────
export const updateBookingStatus = async (req, res) => {
  try {
    const { id }   = req.params;
    const { status, actual_time } = req.body;

    const validStatuses = ['confirmed', 'checked_in', 'checked_out', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const existing = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    // Enforce allowed transitions
    const transitions = {
      confirmed:   ['checked_in', 'cancelled'],
      checked_in:  ['checked_out', 'cancelled'],
      checked_out: [],           // terminal
      cancelled:   [],           // terminal
    };
    if (!transitions[existing.status].includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from "${existing.status}" to "${status}"`,
      });
    }

    const updateData = { status };

    // Set actual timestamps and sync room status
    if (status === 'checked_in') {
      updateData.actual_check_in = actual_time ? new Date(actual_time) : new Date();
      await prisma.room.update({
        where: { id: existing.room_id },
        data:  { status: 'occupied' },
      });
    }

    if (status === 'checked_out') {
      updateData.actual_check_out = actual_time ? new Date(actual_time) : new Date();
      await prisma.room.update({
        where: { id: existing.room_id },
        data:  { status: 'available' },
      });
    }

    if (status === 'cancelled') {
      // Only free the room if it was occupied by THIS booking
      if (existing.status === 'checked_in') {
        await prisma.room.update({
          where: { id: existing.room_id },
          data:  { status: 'available' },
        });
      } else {
        // For confirmed → cancelled, check if room has any other active booking
        const otherActive = await prisma.booking.findFirst({
          where: {
            room_id:    existing.room_id,
            id:         { not: existing.id },
            status:     { in: ['confirmed', 'checked_in'] },
            is_deleted: false,
          },
        });
        if (!otherActive) {
          await prisma.room.update({
            where: { id: existing.room_id },
            data:  { status: 'available' },
          });
        }
      }
    }

    const updated = await prisma.booking.update({
      where:   { id: parseInt(id) },
      data:    updateData,
      include: bookingInclude,
    });

    res.json(updated);
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};

// ─────────────────────────────────────────────
// SOFT DELETE
// ─────────────────────────────────────────────
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });

    if (existing.status === 'checked_in') {
      return res.status(400).json({ error: 'Cannot delete an active checked-in booking.' });
    }

    await prisma.booking.update({
      where: { id: parseInt(id) },
      data:  { is_deleted: true },
    });

    // Free the room if it was occupied by this booking
    if (existing.status === 'confirmed') {
      const otherActive = await prisma.booking.findFirst({
        where: {
          room_id:    existing.room_id,
          id:         { not: existing.id },
          status:     { in: ['confirmed', 'checked_in'] },
          is_deleted: false,
        },
      });
      if (!otherActive) {
        await prisma.room.update({ where: { id: existing.room_id }, data: { status: 'available' } });
      }
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('deleteBooking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};
// ─────────────────────────────────────────────
// DEDICATED CHECK-OUT  (Phase 2B-Part2)
// PATCH /api/bookings/:id/checkout
// body: { remarks? }
// ─────────────────────────────────────────────
export const checkOutBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const existing = await prisma.booking.findUnique({
      where:   { id: parseInt(id) },
      include: { payments: true },
    });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (existing.status !== 'checked_in') {
      return res.status(400).json({
        error: `Cannot check out. Current status is "${existing.status}". Only checked-in bookings can be checked out.`,
      });
    }

    const updateData = {
      status:           'checked_out',
      actual_check_out: new Date(),
    };
    if (remarks !== undefined) updateData.remarks = remarks || existing.remarks;

    const updated = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where:   { id: parseInt(id) },
        data:    updateData,
        include: { ...bookingInclude, payments: true },
      });

      await tx.room.update({
        where: { id: existing.room_id },
        data:  { status: 'available' },
      });

      return booking;
    });

    res.json(updated);
  } catch (error) {
    console.error('checkOutBooking error:', error);
    res.status(500).json({ error: 'Failed to check out booking' });
  }
};

// ─────────────────────────────────────────────
// DEDICATED CHECK-IN  (Phase 2B-Part1)
// PATCH /api/bookings/:id/checkin
// body: { arrival_time?, id_type?, id_number?, guest_count?, remarks? }
// ─────────────────────────────────────────────
export const checkInBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { arrival_time, id_type, id_number, guest_count, remarks } = req.body;

    const existing = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ error: 'Booking not found' });
    if (existing.is_deleted) return res.status(404).json({ error: 'Booking not found' });

    if (existing.status !== 'confirmed') {
      return res.status(400).json({
        error: `Cannot check in. Current status is "${existing.status}". Only confirmed bookings can be checked in.`,
      });
    }

    const now = new Date();
    const updateData = {
      status:          'checked_in',
      actual_check_in: arrival_time ? new Date(arrival_time) : now,
      arrival_time:    arrival_time ? new Date(arrival_time) : now,
    };

    if (id_type    !== undefined) updateData.id_type    = id_type    || null;
    if (id_number  !== undefined) updateData.id_number  = id_number  || null;
    if (guest_count)              updateData.guest_count = parseInt(guest_count);
    if (remarks    !== undefined) updateData.remarks     = remarks    || existing.remarks;

    const updated = await prisma.booking.update({
      where:   { id: parseInt(id) },
      data:    updateData,
      include: bookingInclude,
    });

    // Mark room occupied
    await prisma.room.update({
      where: { id: existing.room_id },
      data:  { status: 'occupied' },
    });

    res.json(updated);
  } catch (error) {
    console.error('checkInBooking error:', error);
    res.status(500).json({ error: 'Failed to check in booking' });
  }
};

// ─────────────────────────────────────────────
// GANTT DATA  (Phase 2A)
// GET /api/bookings/gantt?site_id=X&from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns rooms with their bookings for the requested window
// ─────────────────────────────────────────────
export const getGanttData = async (req, res) => {
  try {
    const { site_id, from, to } = req.query;

    if (!site_id || !from || !to) {
      return res.status(400).json({ error: 'site_id, from and to are required' });
    }

    const fromDate = new Date(from);
    const toDate   = new Date(to);

    if (toDate <= fromDate) {
      return res.status(400).json({ error: 'to must be after from' });
    }

    // All active rooms for this site
    const rooms = await prisma.room.findMany({
      where:   { site_id: parseInt(site_id), is_active: true },
      orderBy: { room_number: 'asc' },
      select:  { id: true, room_number: true, room_type: true, status: true, rate_per_night: true },
    });

    // All non-deleted bookings that overlap the window
    const bookings = await prisma.booking.findMany({
      where: {
        site_id:        parseInt(site_id),
        is_deleted:     false,
        status:         { not: 'cancelled' },
        check_in_date:  { lt: toDate },
        check_out_date: { gt: fromDate },
      },
      select: {
        id: true, room_id: true, guest_name: true, mobile_number: true,
        check_in_date: true, check_out_date: true, total_nights: true,
        total_amount: true, status: true, booking_type: true, rate_per_night: true,
      },
    });

    // Group bookings by room_id
    const byRoom = {};
    for (const b of bookings) {
      if (!byRoom[b.room_id]) byRoom[b.room_id] = [];
      byRoom[b.room_id].push(b);
    }

    const result = rooms.map(r => ({
      ...r,
      bookings: byRoom[r.id] || [],
    }));

    res.json({ rooms: result, from: fromDate, to: toDate });
  } catch (error) {
    console.error('getGanttData error:', error);
    res.status(500).json({ error: 'Failed to fetch Gantt data' });
  }
};
