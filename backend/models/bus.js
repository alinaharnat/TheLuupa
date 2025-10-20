import mongoose from "mongoose";

const busSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // carrier
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  numberPlate: { type: String, required: true, unique: true },
  seats: [{
    seatNumber: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
  }],
}, { timestamps: true });

export default mongoose.model("Bus", busSchema);
