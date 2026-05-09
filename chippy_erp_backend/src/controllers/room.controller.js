import prisma from '../config/prisma.js';

export const getRooms = async (req, res) => {
  try {
    const { site_id } = req.query;
    const filter = site_id ? { site_id: parseInt(site_id) } : {};
    const rooms = await prisma.room.findMany({ 
       where: filter, 
       include: { 
          site: true,
          bookings: {
             orderBy: { id: 'desc' },
             take: 1,
             select: { id: true, booking_type: true }
          }
       } 
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { site_id, room_number, room_type, status } = req.body;
    const room = await prisma.room.create({
      data: {
        site_id: parseInt(site_id),
        room_number,
        room_type,
        status: status || 'available'
      }
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
};
