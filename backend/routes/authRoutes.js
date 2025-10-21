//routes/authRoutes.js
import express from 'express';
import passport from "passport";
import { sendVerificationCode, verifyCodeAndLogin, handleGoogleCallback, getCurrentUser } from '../controllers/authController.js';


const router = express.Router();

// Route to request a code to be sent to an email
router.post('/send-code', sendVerificationCode);

// Route to verify the code and log in/register
router.post('/verify-code', verifyCodeAndLogin);

// Route to get user information
router.get('/me', getCurrentUser);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false, })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
  }),
  handleGoogleCallback
);

export default router;