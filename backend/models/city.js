import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country", required: true },
  latitude: { type: Number },
  longitude: { type: Number },
}, { timestamps: true });

export default mongoose.model("City", citySchema);
