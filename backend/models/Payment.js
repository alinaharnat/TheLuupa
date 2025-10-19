import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  amount: { type: Number, required: true },
  method: {
    type: String,
    enum: ["credit_card", "paypal", "stripe", "apple_pay"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "successful", "failed", "refunded"],
    default: "pending",
  },
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
