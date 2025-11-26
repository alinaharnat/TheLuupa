import mongoose from "mongoose";

const busSchema = new mongoose.Schema({
  carrierId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  busName: { type: String, required: true, trim: true },
  numberPlate: { type: String, required: true, unique: true, trim: true },
  capacity: { type: Number, required: true, min: 1, max: 100 },
  busType: {
    type: String,
    enum: ["standard", "luxury", "minibus"],
    default: "standard"
  },
  amenities: [{
    type: String,
    enum: ["wifi", "ac", "toilet", "tv", "usb", "reclining_seats"]
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Bus", busSchema);
