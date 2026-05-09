import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getEnquiries, createEnquiry, updateEnquiryStatus, updateEnquiry } from '../controllers/enquiry.controller.js';

const router = express.Router();
router.use(authenticateToken); 

router.get('/', getEnquiries);
router.post('/', createEnquiry);
router.put('/:id', updateEnquiry);
router.put('/:id/status', updateEnquiryStatus);

export default router;
