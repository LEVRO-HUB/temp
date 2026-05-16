import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all purchase orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    const whereClause = {};

    if (status !== undefined && status !== 'All' && status !== '') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { vendor_name: { contains: search, mode: 'insensitive' } },
        { po_number: { contains: search, mode: 'insensitive' } }
      ];
    }

    const pos = await prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        employee: { select: { id: true, name: true } },
        site: { select: { id: true, site_name: true } },
        items: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(pos);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
};

// Create a new purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    const { 
      vendor_name, site_id, items, department, priority, 
      payment_terms, expected_delivery, delivery_location, 
      contact_person, remarks, status 
    } = req.body;
    
    // items should be an array of { description, unit, quantity, unit_price, total_price }

    // Auto-generate PO Number
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${2026}-${1000 + count + 1}`;

    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    const tax_amount = subtotal * 0.18; // 18% GST as per template
    const total_amount = subtotal + tax_amount;

    const result = await prisma.$transaction(async (tx) => {
      const newPo = await tx.purchaseOrder.create({
        data: {
          po_number: poNumber,
          vendor_name,
          site_id: parseInt(site_id),
          department,
          priority: priority || "normal",
          payment_terms,
          expected_delivery: expected_delivery ? new Date(expected_delivery) : null,
          delivery_location,
          contact_person,
          remarks,
          subtotal,
          tax_amount,
          total_amount,
          status: status || 'pending',
          created_by: req.user.id
        }
      });

      if (items && items.length > 0) {
        await tx.purchaseOrderItem.createMany({
          data: items.map(item => ({
            purchase_order_id: newPo.id,
            description: item.description,
            unit: item.unit,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price),
            total_price: parseFloat(item.total_price)
          }))
        });
      }

      return await tx.purchaseOrder.findUnique({
        where: { id: newPo.id },
        include: { items: true, employee: { select: { id: true, name: true } }, site: { select: { id: true, site_name: true } } }
      });
    });

    res.status(201).json({ message: 'Purchase order created successfully', purchaseOrder: result });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order', details: error.message });
  }
};

// Update PO status flag
export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updated = await prisma.purchaseOrder.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    
    res.json({ message: 'Status updated', purchaseOrder: updated });
  } catch(error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};
