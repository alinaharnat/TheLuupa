import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, required: true },
  role: {
    type: String,
    enum: ["admin", "carrier", "passenger"],
    default: "passenger",
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
