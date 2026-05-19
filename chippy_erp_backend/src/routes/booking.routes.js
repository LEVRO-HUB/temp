import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getBookings,
  getAvailableRooms,
  getGanttData,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} from '../controllers/booking.controller.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/',                       getBookings);
router.get('/available-rooms',        getAvailableRooms);   // ✅ Phase 1 — availability check
router.get('/gantt',                  getGanttData);        // ✅ Phase 2A — Gantt timeline
router.post('/',                      createBooking);
router.put('/:id',                    updateBooking);
router.patch('/:id/status',           updateBookingStatus); // ✅ NEW — status transitions
router.delete('/:id',                 deleteBooking);       // ✅ NEW — soft delete

export default router;