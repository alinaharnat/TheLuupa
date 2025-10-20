import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Schedule from "../models/Schedule.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const updatePrices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const schedules = await Schedule.find();

    const newPrices = [25, 30, 22, 35, 28];

    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      schedule.price = newPrices[i % newPrices.length];
      await schedule.save();
      console.log(`Updated schedule ${schedule._id} with price: ${schedule.price}`);
    }

    console.log("All prices updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error updating prices:", error);
    process.exit(1);
  }
};

updatePrices();
