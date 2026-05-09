import express from 'express';
import { authenticateToken, requireManagerOrAdmin } from '../middleware/auth.js';
import { getZones, createZone, getSites, createSite, updateZone, updateSite } from '../controllers/zoneSite.controller.js';

const router = express.Router();
router.use(authenticateToken); // all need auth

router.get('/zones', getZones);
router.post('/zones', requireManagerOrAdmin, createZone);
router.put('/zones/:id', requireManagerOrAdmin, updateZone);

router.get('/sites', getSites);
router.post('/sites', requireManagerOrAdmin, createSite);
router.put('/sites/:id', requireManagerOrAdmin, updateSite);

export default router;
