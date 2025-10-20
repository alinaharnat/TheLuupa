//routes/searchRoutes.js
import express from 'express';
import { searchTrips } from '../controllers/searchController.js';

const router = express.Router();

// POST /api/search - search for trips
router.post('/', searchTrips);

export default router;
