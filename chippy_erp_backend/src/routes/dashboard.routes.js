import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getDashboardMetrics } from '../controllers/dashboard.controller.js';

const router = express.Router();
router.use(authenticateToken); 

router.get('/', getDashboardMetrics);

export default router;
