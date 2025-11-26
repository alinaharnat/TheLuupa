//routes/adminRoutes.js
import express from 'express';
import { getCarrierApplications, reviewCarrierApplication } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.route('/carrier-applications')
  .get(protect, admin, getCarrierApplications);

router.route('/carrier-applications/:id')
  .put(protect, admin, reviewCarrierApplication);

export default router;
