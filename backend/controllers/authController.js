//controllers/authController.js
import User from '../models/user.js';
import jwt from "jsonwebtoken";
import { generateUserId } from '../utils/generateId.js';
import { generateToken, generateEmailVerificationToken } from '../utils/generateToken.js';
import { sendVerificationEmail } from '../config/email.js';
import { AUTH } from '../config/constants.js';

/**
 * @desc    Sends a verification code to the specified email.
 * It finds an existing user or creates a new one if not found.
 * @route   POST /api/auth/send-code
 * @access  Public
 */
const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email' });
  }

  try {
    const verificationToken = generateEmailVerificationToken();
    const tokenExpires = new Date(Date.now() + AUTH.EMAIL_VERIFICATION_EXPIRY_MS);

    let user = await User.findOne({ email });

    if (user) {
      // If user exists, update their token and expiry date
      user.emailVerificationToken = verificationToken;
      user.emailVerificationTokenExpires = tokenExpires;
      await user.save();
    } else {
      // If user does not exist, create a new user record with the token
      const userId = await generateUserId();
      user = await User.create({
        email,
        userId,
        name: email.split('@')[0], // Temporary name from email
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpires: tokenExpires,
      });
    }

    // Send the code via email
    await sendVerificationEmail(email, verificationToken);

    res.status(200).json({ message: 'A verification code has been sent to your email.' });

  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Verifies the code, creates/logs in the user, and returns a JWT.
 * The token is cleared after successful verification.
 * @route   POST /api/auth/verify-code
 * @access  Public
 */
const verifyCodeAndLogin = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Please provide both email and code' });
  }

  try {
    // Find the user with a matching and non-expired token
    const user = await User.findOne({
      email,
      emailVerificationToken: code,
      emailVerificationTokenExpires: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // Determine if this is the user's first time verifying (a new registration)
    const isNewUser = !user.isEmailVerified;

    // Mark email as verified and clear the token fields for security
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    // Generate a JWT
    const token = generateToken(user._id);

    // Send the token and user data to the client
    res.status(200).json({
      _id: user._id,
      userId: user.userId,
      email: user.email,
      name: user.name,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      companyName: user.companyName,
      phoneNumber: user.phoneNumber,
      licenseNumber: user.licenseNumber,
      token,
      isNewUser, // Useful for frontend logic, e.g., redirect to a profile completion page
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Confirms successful login via Google OAuth.
 * The token is cleared after successful verification.
 * @route   POST /api/auth/google/callback
 * @access  Public
 */
export const handleGoogleCallback = async (req, res) => {
  if (!req.user) {
    return res.redirect("/login?error=google_auth_failed");
  }

  const user = req.user;

  // Generate JWT same as in email authentication
  const token = generateToken(user._id);

  // Redirect back to frontend with token in query params
  const redirectUrl = process.env.FRONTEND_URL + `/auth/success?token=${token}`;
  return res.redirect(redirectUrl);
};

export { sendVerificationCode, verifyCodeAndLogin };

/**
 * @desc    Return current user data
 * @route   GET /api/auth/me
 * @access  Private
*/
export const getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    res.status(401).json({ message: "Not authorized" });
  }
};