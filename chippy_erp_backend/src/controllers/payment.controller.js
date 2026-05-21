import prisma from '../config/prisma.js';

const normalizeTransactionType = (value) => {
  const key = String(value || '').toLowerCase();
  if (['debit', 'refund'].includes(key)) return 'debit';
  return 'credit';
};

const normalizePaymentType = (value) => {
  const key = String(value || '').toLowerCase();
  if (['full'].includes(key)) return 'full';
  if (['partial'].includes(key)) return 'partial';
  return 'advance';
};

const normalizePaymentMethod = (value) => {
  const key = String(value || '').toLowerCase().replace(/[\s_-]+/g, '');
  const methods = {
    cash: 'cash',
    upi: 'upi',
    bank: 'bank',
    banktransfer: 'bank',
    neft: 'bank',
    card: 'card',
    creditcard: 'card',
    debitcard: 'card',
    cheque: 'cheque',
    check: 'cheque',
    rtgs: 'rtgs',
  };
  return methods[key] || 'cash';
};

export const getPayments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const { booking_id, method, type_of_method } = req.query;

    const where = { is_deleted: false };
    if (booking_id) where.booking_id = parseInt(booking_id);
    const methodFilter = type_of_method || method;
    if (methodFilter) where.type_of_method = normalizePaymentMethod(methodFilter);
    if (search) {
      where.OR = [
        { payment_no: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } },
        { booking: { guest_name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { booking: true, createdBy: { select: { name: true } } },
        orderBy: { payment_date: 'desc' },
        skip,
        take: limit
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      data: payments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { 
      payment_no, transaction_type, type_of_method, payment_type, cheque_no, cheque_date, 
      rtgs_ref_no, currency_code, ex_rate, sub_total_in_forex, tax_amt_in_forex, 
      payment_amt_in_forex, payment_amt_in_base, site_id, booking_id, remarks 
    } = req.body;
    const amount = payment_amt_in_base ? parseFloat(payment_amt_in_base) : 0;

    // Use Prisma transaction to ensure payment is tied safely to booking
    const payment = await prisma.$transaction(async (tx) => {
      // 1. Verify Booking exists
      const booking = await tx.booking.findUnique({ where: { id: parseInt(booking_id) } });
      if (!booking) {
        throw new Error('Associated booking not found');
      }

      // 2. Create the Payment record
      const newPayment = await tx.payment.create({
        data: {
          payment_no: payment_no || `SYS-${Date.now().toString().slice(-6)}`,
          transaction_type: normalizeTransactionType(transaction_type), 
          type_of_method: normalizePaymentMethod(type_of_method || req.body.method),
          payment_type: normalizePaymentType(payment_type), 
          cheque_no,
          cheque_date: cheque_date ? new Date(cheque_date) : null,
          rtgs_ref_no,
          currency_code: currency_code || 'INR',
          ex_rate: ex_rate ? parseFloat(ex_rate) : 1.0,
          sub_total_in_forex: sub_total_in_forex ? parseFloat(sub_total_in_forex) : amount,
          tax_amt_in_forex: tax_amt_in_forex ? parseFloat(tax_amt_in_forex) : 0,
          payment_amt_in_forex: payment_amt_in_forex ? parseFloat(payment_amt_in_forex) : amount,
          payment_amt_in_base: amount,
          site_id: site_id ? parseInt(site_id) : booking.site_id,
          booking_id: parseInt(booking_id),
          remarks,
          created_by_id: req.user.id
        }
      });
      return newPayment;
    });

    res.status(201).json(payment);
  } catch (error) {
    if (error.message === 'Associated booking not found') {
       return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to record payment transaction', details: error.message });
  }
};

export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      transaction_type, type_of_method, payment_type, cheque_no, cheque_date, 
      rtgs_ref_no, currency_code, payment_amt_in_base, site_id, booking_id, remarks 
    } = req.body;

    const dataObj = { cheque_no, rtgs_ref_no, currency_code, remarks };
    if (transaction_type !== undefined) dataObj.transaction_type = normalizeTransactionType(transaction_type);
    if (payment_type !== undefined) dataObj.payment_type = normalizePaymentType(payment_type);
    if (type_of_method !== undefined || req.body.method !== undefined) {
      dataObj.type_of_method = normalizePaymentMethod(type_of_method || req.body.method);
    }
    
    if (cheque_date) dataObj.cheque_date = new Date(cheque_date);
    if (payment_amt_in_base !== undefined) dataObj.payment_amt_in_base = parseFloat(payment_amt_in_base);
    if (booking_id) dataObj.booking_id = parseInt(booking_id);
    if (site_id) dataObj.site_id = parseInt(site_id);

    const payment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: dataObj
    });
    
    res.json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update payment transaction' });
  }
};
