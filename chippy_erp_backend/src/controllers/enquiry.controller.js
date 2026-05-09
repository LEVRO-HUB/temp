import prisma from '../config/prisma.js';

export const getEnquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { guest_name: { contains: search, mode: 'insensitive' } },
        { mobile_number: { contains: search, mode: 'insensitive' } },
        { place: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({ 
        where,
        include: { 
          site: true, 
          employee: { select: { name: true } } 
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.enquiry.count({ where })
    ]);

    res.json({
      data: enquiries,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
};

export const createEnquiry = async (req, res) => {
  try {
    const { guest_name, mobile_number, place, site_id, room_type_requested, check_in_date, check_out_date, no_of_days, enquiry_source, remarks } = req.body;
    
    const enquiry = await prisma.enquiry.create({
      data: {
        guest_name,
        mobile_number,
        place,
        site_id: parseInt(site_id),
        room_type_requested,
        check_in_date: new Date(check_in_date),
        check_out_date: check_out_date ? new Date(check_out_date) : undefined,
        no_of_days: parseInt(no_of_days),
        enquiry_source,
        remarks,
        status: 'new',
        created_by: req.user.id
      }
    });
    res.status(201).json(enquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const enquiry = await prisma.enquiry.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
};

export const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_name, mobile_number, place, site_id, room_type_requested, check_in_date, check_out_date, no_of_days, enquiry_source, remarks, status, email, time } = req.body;
    
    // Safely structure data for update since not all fields might be provided
    const updateData = { 
       guest_name, mobile_number, place, email, room_type_requested, 
       no_of_days: no_of_days ? parseInt(no_of_days) : undefined, 
       enquiry_source, remarks, status
    };
    
    if(site_id) updateData.site_id = parseInt(site_id);
    if(check_in_date) updateData.check_in_date = new Date(check_in_date);
    if(check_out_date) updateData.check_out_date = new Date(check_out_date);
    
    const enquiry = await prisma.enquiry.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json(enquiry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to full update enquiry' });
  }
};
