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
  isSurprise: { type: Boolean, default: false }, // Flag to indicate if this is a surprise trip
  destinationRevealed: { type: Boolean, default: false }, // Flag to track if destination has been revealed
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
