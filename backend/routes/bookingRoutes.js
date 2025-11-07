import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAvailableSeats,
  getScheduleDetails,
  revealDestination
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/schedule/:scheduleId/seats', getAvailableSeats);
router.get('/schedule/:scheduleId', getScheduleDetails);

// Protected routes
router.post('/', protect, createBooking);
router.get('/', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/reveal-destination', protect, revealDestination);

export default router;
