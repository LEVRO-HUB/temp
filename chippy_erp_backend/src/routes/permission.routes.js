import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getPermissionsByRole, bulkUpdatePermissions } from '../controllers/permission.controller.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/:roleId', getPermissionsByRole);
router.post('/:roleId/bulk', bulkUpdatePermissions);

export default router;
