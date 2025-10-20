//routes/authRoutes.js
import express from 'express';
import { sendVerificationCode, verifyCodeAndLogin } from '../controllers/authController.js';

const router = express.Router();

// Route to request a code to be sent to an email
router.post('/send-code', sendVerificationCode);

// Route to verify the code and log in/register
router.post('/verify-code', verifyCodeAndLogin);

export default router;