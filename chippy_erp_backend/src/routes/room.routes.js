import express from 'express';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth.js';
import { getRooms, createRoom } from '../controllers/room.controller.js';

const router = express.Router();
router.use(authenticateToken); 

router.get('/', getRooms);
router.post('/', requireManagerOrAdmin, createRoom);

export default router;
