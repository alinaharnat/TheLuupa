//app.js
import express from "express";
import cors from "cors";
import passport from "passport";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const app = express();

//app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Додаємо middleware для парсингу текстових полів із FormData
//app.use(express.urlencoded({ extended: true }));
//app.use(express.json());

// require('./config/cronJobs');
// require('./config/cronJobs');

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
app.use(passport.initialize());
//require('./config/passport')(passport);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);

// Health check route
app.get('/', (req, res) => {
  res.send('API works');
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;