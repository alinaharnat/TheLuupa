import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" }, // Optional since schedule may be deleted
  type: {
    type: String,
    enum: ["schedule_change", "delay", "cancellation"],
    default: "schedule_change",
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  changes: {
    departureTime: { old: Date, new: Date },
    arrivalTime: { old: Date, new: Date },
  },
  // Store schedule details so they're available even if schedule is deleted
  scheduleDetails: {
    from: { type: String },
    to: { type: String },
    busName: { type: String },
    busNumberPlate: { type: String },
    departureTime: { type: Date },
    arrivalTime: { type: Date },
  },
  isRead: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);

