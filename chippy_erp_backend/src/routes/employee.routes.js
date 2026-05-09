import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { 
  createEmployee, 
  getAllEmployees, 
  getEmployeeById, 
  updateEmployee, 
  toggleLoginAccess,
  getCurrentEmployee,
  updateCurrentEmployee,
  changePassword
} from '../controllers/employee.controller.js';

const router = express.Router();

// All employee routes require authentication
router.use(authenticateToken);

// Profile routes (Me) - MUST come before /:id routes
router.get('/me', getCurrentEmployee);
router.put('/me', updateCurrentEmployee);
router.put('/me/password', changePassword);

router.get('/', getAllEmployees);
router.get('/:id', getEmployeeById);

// Only admins can create or update employees entirely
router.post('/', requireAdmin, createEmployee);
router.put('/:id', requireAdmin, updateEmployee);

// Specific route for enabling/disabling login access (Admin only)
router.patch('/:id/login-access', requireAdmin, toggleLoginAccess);

export default router;
