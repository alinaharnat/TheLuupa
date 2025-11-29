import express from "express";
import { protect, carrier } from "../middleware/authMiddleware.js";
import {
  getMySchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getCarrierBookings,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.route("/")
  .get(protect, carrier, getMySchedules)
  .post(protect, carrier, createSchedule);

router.get("/bookings", protect, carrier, getCarrierBookings);

router.route("/:id")
  .get(protect, carrier, getScheduleById)
  .put(protect, carrier, updateSchedule)
  .delete(protect, carrier, deleteSchedule);

export default router;
