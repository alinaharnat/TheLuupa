import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, required: true },
  price: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("Schedule", scheduleSchema);
