//routes/userRoutes.js
import express from 'express';
import { getUserProfile, updateUserProfile, submitCarrierApplication, getMyCarrierApplication } from '../controllers/userController.js';
import { getMyNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../controllers/notificationController.js';
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

// Notification routes
router.route('/notifications')
  .get(protect, getMyNotifications);

router.route('/notifications/unread-count')
  .get(protect, getUnreadCount);

router.route('/notifications/read-all')
  .put(protect, markAllAsRead);

router.route('/notifications/:id/read')
  .put(protect, markAsRead);

export default router;
