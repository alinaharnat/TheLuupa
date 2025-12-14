//models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  name: {
    type: String,
    required: true
  },
  dateOfBirth: { type: Date, required: false, default: null },
  role: {
    type: String,
    enum: ["admin", "carrier", "passenger"],
    default: "passenger",
  },
  // Carrier-specific fields
  companyName: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  emailVerificationToken: {
    type: String
  },
  emailVerificationTokenExpires: {
    type: Date
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
