import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getBookings, createBooking, updateBooking } from '../controllers/booking.controller.js';

const router = express.Router();
router.use(authenticateToken); 

router.get('/', getBookings);
router.post('/', createBooking);
router.put('/:id', updateBooking);

export default router;
