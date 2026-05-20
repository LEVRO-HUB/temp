import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getBookings,
  getBookingById,
  getAvailableRooms,
  getGanttData,
  createBooking,
  updateBooking,
  updateBookingStatus,
  checkInBooking,
  deleteBooking,
} from '../controllers/booking.controller.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/',                       getBookings);
router.get('/available-rooms',        getAvailableRooms);   // Phase 1 — availability check
router.get('/gantt',                  getGanttData);        // Phase 2A — Gantt timeline
router.get('/:id',                    getBookingById);      // Phase 2B — single booking
router.post('/',                      createBooking);
router.put('/:id',                    updateBooking);
router.patch('/:id/status',           updateBookingStatus); // Phase 1 — generic status transitions
router.patch('/:id/checkin',          checkInBooking);      // Phase 2B-P1 — dedicated check-in
router.delete('/:id',                 deleteBooking);       // soft delete

export default router;