import express from 'express';
import { createCheckoutSession, stripeWebhook, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/create-session', protect, createCheckoutSession);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default router;
