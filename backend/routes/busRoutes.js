import express from "express";
import { protect, carrier } from "../middleware/authMiddleware.js";
import {
  getMyBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
} from "../controllers/busController.js";

const router = express.Router();

router.route("/")
  .get(protect, carrier, getMyBuses)
  .post(protect, carrier, createBus);

router.route("/:id")
  .get(protect, carrier, getBusById)
  .put(protect, carrier, updateBus)
  .delete(protect, carrier, deleteBus);

export default router;
