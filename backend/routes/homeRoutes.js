//routes/homeRoutes.js
import express from 'express';
import { getPopularRoutes, getTopCarriers } from '../controllers/homeController.js';

const router = express.Router();

// Public routes
router.get('/popular-routes', getPopularRoutes);
router.get('/top-carriers', getTopCarriers);

export default router;

