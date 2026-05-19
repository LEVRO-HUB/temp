import prisma from '../config/prisma.js';

export const getRooms = async (req, res) => {
  try {
    const { site_id } = req.query;
    const filter = site_id ? { site_id: parseInt(site_id), is_active: true } : { is_active: true };

    const rooms = await prisma.room.findMany({
      where: filter,
      include: {
        site: true,
        bookings: {
          where: { status: { in: ['confirmed', 'checked_in'] }, is_deleted: false },
          orderBy: { check_in_date: 'asc' },
          select: { id: true, guest_name: true, check_in_date: true, check_out_date: true, status: true },
        },
      },
      orderBy: [{ site_id: 'asc' }, { room_number: 'asc' }],
    });
    res.json(rooms);
  } catch (error) {
    console.error('getRooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { site_id, room_number, room_type, status } = req.body;
    const room = await prisma.room.create({
      data: {
        site_id:        parseInt(site_id),
        room_number,
        room_type,
        status:         status || 'available',
      },
    });
    res.status(201).json(room);
  } catch (error) {
    console.error('createRoom error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

// ✅ NEW — update room (rate, status, type)
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, room_type, status, is_active } = req.body;

    const data = {};
    if (room_number    !== undefined) data.room_number    = room_number;
    if (room_type      !== undefined) data.room_type      = room_type;
    if (status         !== undefined) data.status         = status;
    if (is_active      !== undefined) data.is_active      = is_active;

    const room = await prisma.room.update({
      where: { id: parseInt(id) },
      data,
    });
    res.json(room);
  } catch (error) {
    console.error('updateRoom error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
};