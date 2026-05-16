import prisma from '../config/prisma.js';

export const getDashboardMetrics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(yesterday.getDate() - 1);

    const [
      dailyEnquiriesCount,
      yesterdayEnquiriesCount,
      totalBookingsCount,
      yesterdayBookingsCount,
      totalRevenueAggr,
      yesterdayRevenueAggr,
      totalEnquiriesCount,
      convertedEnquiriesCount,
      recentEnquiriesData,
      recentBookingsData,
      recentPaymentsData,
      siteRevenuesData,
      roomStatsData,
      trendBookingsRaw,
      trendEnquiriesRaw
    ] = await Promise.all([
      prisma.enquiry.count({ where: { created_at: { gte: today } } }),
      prisma.enquiry.count({ where: { created_at: { gte: yesterday, lt: today } } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { created_at: { lt: today } } }), // Total until yesterday
      prisma.booking.aggregate({ _sum: { total_amount: true } }),
      prisma.booking.aggregate({ _sum: { total_amount: true }, where: { created_at: { lt: today } } }),
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: 'converted' } }),
      prisma.enquiry.findMany({ orderBy: { id: 'desc' }, take: 8, include: { site: true } }),
      prisma.booking.findMany({ orderBy: { id: 'desc' }, take: 8, include: { site: true } }),
      prisma.payment.findMany({ orderBy: { id: 'desc' }, take: 7 }),
      prisma.site.findMany({ include: { bookings: true } }),
      prisma.room.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.booking.findMany({ where: { booking_date: { gte: sevenDaysAgo } } }),
      prisma.enquiry.findMany({ where: { created_at: { gte: sevenDaysAgo } } })
    ]);

    const totalRevenue = totalRevenueAggr._sum.total_amount || 0;
    const yesterdayRevenue = yesterdayRevenueAggr._sum.total_amount || 0;

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return parseFloat((((curr - prev) / prev) * 100).toFixed(1));
    };

    const enquiryChange = calcChange(dailyEnquiriesCount, yesterdayEnquiriesCount);
    // For total bookings/revenue, we show change in the *rate* of growth if needed, 
    // but usually, it's easier to show today's vs yesterday's incremental gain.
    // Let's get today's incremental bookings/revenue first.
    const todayBookingsCount = await prisma.booking.count({ where: { created_at: { gte: today } } });
    const yesterdayIncrementalBookings = await prisma.booking.count({ where: { created_at: { gte: yesterday, lt: today } } });
    const bookingChange = calcChange(todayBookingsCount, yesterdayIncrementalBookings);

    const todayRevenueAggr = await prisma.booking.aggregate({ _sum: { total_amount: true }, where: { created_at: { gte: today } } });
    const todayRevenue = todayRevenueAggr._sum.total_amount || 0;
    const yesterdayIncrementalRevenueAggr = await prisma.booking.aggregate({ _sum: { total_amount: true }, where: { created_at: { gte: yesterday, lt: today } } });
    const yesterdayIncrementalRevenue = yesterdayIncrementalRevenueAggr._sum.total_amount || 0;
    const revenueChange = calcChange(todayRevenue, yesterdayIncrementalRevenue);

    const bookingConversionRate = totalEnquiriesCount === 0 ? 0 : parseFloat(((convertedEnquiriesCount / totalEnquiriesCount) * 100).toFixed(2));
    
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const recentEnquiries = recentEnquiriesData.map(e => ({
      time: formatTime(e.created_at),
      guest_name: e.guest_name,
      mobile: e.mobile_number,
      site: e.site?.site_name || 'N/A',
      status: e.status ? e.status.charAt(0).toUpperCase() + e.status.slice(1) : 'New',
      source: e.enquiry_source || 'Unknown',
      room_type: e.room_type_requested || 'Unknown'
    }));

    const recentBookings = recentBookingsData.map(b => ({
      id: `BKG-${10000 + b.id}`,
      guest_name: b.guest_name,
      site: b.site?.site_name || 'N/A',
      check_in: formatDate(b.check_in_date),
      amount: b.total_amount
    }));

    const recentPayments = recentPaymentsData.map(p => ({
      payment_no: p.payment_no,
      booking_id: `BKG-${10000 + p.booking_id}`,
      date: formatDate(p.payment_date),
      amount: p.payment_amt_in_base,
      status: 'Success'
    }));

    const siteRevenues = siteRevenuesData.map(s => ({
      name: s.site_name,
      revenue: s.bookings.reduce((sum, b) => sum + b.total_amount, 0)
    })).filter(s => s.revenue > 0).sort((a,b) => b.revenue - a.revenue);

    let roomStats = { available: 0, occupied: 0, cleaning: 0, maintenance: 0, total: 0 };
    roomStatsData.forEach(r => {
      const status = r.status.toLowerCase();
      if (roomStats.hasOwnProperty(status)) {
         roomStats[status] = r._count._all;
      }
    });
    roomStats.total = roomStats.available + roomStats.occupied + roomStats.cleaning + roomStats.maintenance;

    const trendEnquiries = [];
    for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        d.setHours(0,0,0,0);
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const dStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        const enqCount = trendEnquiriesRaw.filter(e => new Date(e.created_at) >= d && new Date(e.created_at) < nextD).length;
        const bkgCount = trendBookingsRaw.filter(b => new Date(b.booking_date) >= d && new Date(b.booking_date) < nextD).length;

        trendEnquiries.push({ date: dStr, enquiries: enqCount, bookings: bkgCount });
    }

    res.json({
      dailyEnquiriesCount,
      totalBookingsCount,
      totalRevenue,
      bookingConversionRate,
      enquiryChange,
      bookingChange,
      revenueChange,
      trendEnquiries,
      recentEnquiries,
      recentBookings,
      recentPayments,
      siteRevenues,
      roomStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};
