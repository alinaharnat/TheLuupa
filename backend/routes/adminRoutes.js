//routes/adminRoutes.js
import express from 'express';
import { getUsers, updateUser, deleteUser, getCarrierApplications, reviewCarrierApplication } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role

// User management routes
router.route('/users')
  .get(protect, admin, getUsers);

router.route('/users/:id')
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

// Carrier application routes
router.route('/carrier-applications')
  .get(protect, admin, getCarrierApplications);

router.route('/carrier-applications/:id')
  .put(protect, admin, reviewCarrierApplication);

export default router;
