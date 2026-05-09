import prisma from '../config/prisma.js';

export const getBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const where = {};
    if (search) {
      where.OR = [
        { guest_name: { contains: search, mode: 'insensitive' } },
        { mobile_number: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({ 
        where,
        include: { site: true, room: true, employee: { select: { name: true } } },
        orderBy: { booking_date: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      data: bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { 
      enquiry_id, site_id, room_id, booking_type, guest_name, 
      guest_count, mobile_number, place, check_in_date, check_out_date, total_amount 
    } = req.body;

    const inDate = new Date(check_in_date);
    const outDate = new Date(check_out_date);
    const total_nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));

    const booking = await prisma.booking.create({
      data: {
        enquiry_id: enquiry_id ? parseInt(enquiry_id) : null,
        site_id: parseInt(site_id) || 1, // Fallback safe
        room_id: room_id ? parseInt(room_id) : (req.body.room_unit ? parseInt(req.body.room_unit) : 1),
        booking_type: booking_type || 'Walk-In',
        guest_name,
        guest_count: parseInt(guest_count) || 1,
        mobile_number,
        place,
        check_in_date: inDate,
        check_out_date: outDate,
        total_nights,
        total_amount: parseFloat(total_amount) || 0,
        created_by: req.user.id
      }
    });

    // Optionally update enquiry to converted
    if (enquiry_id) {
       await prisma.enquiry.update({
         where: { id: parseInt(enquiry_id) },
         data: { status: 'converted' }
       });
    }

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      enquiry_id, site_id, room_id, booking_type, guest_name, 
      guest_count, mobile_number, place, check_in_date, check_out_date, total_amount 
    } = req.body;

    const dataObj = { booking_type, guest_name, mobile_number, place };
    
    if (guest_count) dataObj.guest_count = parseInt(guest_count);
    if (site_id) dataObj.site_id = parseInt(site_id);
    if (room_id) dataObj.room_id = parseInt(room_id);
    if (enquiry_id) dataObj.enquiry_id = parseInt(enquiry_id);
    if (total_amount) dataObj.total_amount = parseFloat(total_amount);
    
    if (check_in_date) dataObj.check_in_date = new Date(check_in_date);
    if (check_out_date) {
        const outDate = new Date(check_out_date);
        dataObj.check_out_date = outDate;
        if (dataObj.check_in_date || req.body.check_in_date) {
           const inD = dataObj.check_in_date || new Date(req.body.check_in_date);
           dataObj.total_nights = Math.ceil((outDate - inD) / (1000 * 60 * 60 * 24));
        }
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: dataObj
    });
    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};
