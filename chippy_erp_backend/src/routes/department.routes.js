import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getAllDepartments, createDepartment } from '../controllers/department.controller.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/', getAllDepartments);
router.post('/', requireAdmin, createDepartment);

export default router;
