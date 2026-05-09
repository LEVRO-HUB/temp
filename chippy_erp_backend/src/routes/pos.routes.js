import express from 'express';
import { getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus } from '../controllers/pos.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getPurchaseOrders);
router.post('/', authenticateToken, createPurchaseOrder);
router.put('/:id/status', authenticateToken, updatePurchaseOrderStatus);

export default router;
