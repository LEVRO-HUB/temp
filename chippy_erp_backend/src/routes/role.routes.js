import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getAllRoles, createRole } from '../controllers/role.controller.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getAllRoles);
router.post('/', requireAdmin, createRole);

export default router;
