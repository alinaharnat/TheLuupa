import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
  seatId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seat", required: true }], // масив заброньованих місць
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
