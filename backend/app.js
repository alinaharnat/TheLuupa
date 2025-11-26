//app.js
import express from "express";
import cors from "cors";
import passport from "passport";
import setupGooglePassport from "./config/passport.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import surpriseRoutes from './routes/surprise.js';
import cityRoutes from './routes/cityRoutes.js';
import countryRoutes from './routes/countryRoutes.js';
import homeRoutes from './routes/homeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import busRoutes from './routes/busRoutes.js';

const app = express();

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

import startSurpriseReminderCron from './config/cronJobs.js';

// Start cron jobs
startSurpriseReminderCron();

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://zalupa.onrender.com/' //Change whitelist for the future onrender address
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
setupGooglePassport();
app.use(passport.initialize());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/surprise", surpriseRoutes);
app.use('/api/payments', paymentRoutes);

app.use("/api/cities", cityRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/buses", busRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('API works');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;