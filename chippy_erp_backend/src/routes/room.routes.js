import express from 'express';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth.js';
import { getRooms, createRoom, updateRoom } from '../controllers/room.controller.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/',     getRooms);
router.post('/',    requireManagerOrAdmin, createRoom);
router.put('/:id',  requireManagerOrAdmin, updateRoom);  // ✅ NEW — edit rate/status

export default router;