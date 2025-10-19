import mongoose from "mongoose";

const routeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // carrier
  cityId: [{ type: mongoose.Schema.Types.ObjectId, ref: "City", required: true }], // масив міст маршруту
  distance: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("Route", routeSchema);
