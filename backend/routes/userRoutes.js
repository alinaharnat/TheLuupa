//routes/userRoutes.js
import express from 'express';
import { getUserProfile, updateUserProfile, submitCarrierApplication, getMyCarrierApplication } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Both routes require authentication
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Carrier application routes
router.route('/carrier-application')
  .get(protect, getMyCarrierApplication)
  .post(protect, submitCarrierApplication);

export default router;
