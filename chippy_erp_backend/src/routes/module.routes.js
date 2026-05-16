import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getAllModules } from '../controllers/module.controller.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/', getAllModules);

export default router;
