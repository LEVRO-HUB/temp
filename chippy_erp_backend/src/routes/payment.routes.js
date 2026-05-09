import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getPayments, createPayment, updatePayment } from '../controllers/payment.controller.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', getPayments);
router.post('/', createPayment);
router.put('/:id', updatePayment);

export default router;
