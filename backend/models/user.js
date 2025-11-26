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
    required: [true, 'Будь ласка, вкажіть вашу електронну пошту'], // Повідомлення про помилку валідації
    unique: true,
    trim: true, // Видаляє пробіли на початку та в кінці
    lowercase: true, // Зберігає email в нижньому регістрі
    match: [ // Валідація формату email
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Будь ласка, вкажіть дійсну електронну пошту',
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
