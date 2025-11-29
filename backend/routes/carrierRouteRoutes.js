import express from "express";
import { protect, carrier } from "../middleware/authMiddleware.js";
import {
  getMyRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} from "../controllers/routeController.js";

const router = express.Router();

router.route("/")
  .get(protect, carrier, getMyRoutes)
  .post(protect, carrier, createRoute);

router.route("/:id")
  .get(protect, carrier, getRouteById)
  .put(protect, carrier, updateRoute)
  .delete(protect, carrier, deleteRoute);

export default router;
