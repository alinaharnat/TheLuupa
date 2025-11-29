import mongoose from "mongoose";
import dotenv from "dotenv";
import City from "../models/city.js";

dotenv.config();

// Ukrainian cities with their coordinates
const cityCoordinates = {
  "Kyiv": { latitude: 50.4501, longitude: 30.5234 },
  "Lviv": { latitude: 49.8397, longitude: 24.0297 },
  "Odesa": { latitude: 46.4825, longitude: 30.7233 },
  "Kharkiv": { latitude: 49.9935, longitude: 36.2304 },
  "Dnipro": { latitude: 48.4647, longitude: 35.0462 },
  "Zaporizhzhia": { latitude: 47.8388, longitude: 35.1396 },
  "Vinnytsia": { latitude: 49.2331, longitude: 28.4682 },
  "Poltava": { latitude: 49.5883, longitude: 34.5514 },
  "Chernihiv": { latitude: 51.4982, longitude: 31.2893 },
  "Cherkasy": { latitude: 49.4444, longitude: 32.0598 },
  "Zhytomyr": { latitude: 50.2547, longitude: 28.6587 },
  "Sumy": { latitude: 50.9077, longitude: 34.7981 },
  "Rivne": { latitude: 50.6199, longitude: 26.2516 },
  "Ivano-Frankivsk": { latitude: 48.9226, longitude: 24.7111 },
  "Ternopil": { latitude: 49.5535, longitude: 25.5948 },
  "Lutsk": { latitude: 50.7472, longitude: 25.3254 },
  "Khmelnytskyi": { latitude: 49.4229, longitude: 26.9871 },
  "Mykolaiv": { latitude: 46.9750, longitude: 31.9946 },
  "Kropyvnytskyi": { latitude: 48.5079, longitude: 32.2623 },
  "Uzhhorod": { latitude: 48.6208, longitude: 22.2879 },
};

const updateCityCoordinates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const cities = await City.find({});
    console.log(`Found ${cities.length} cities in database`);

    let updatedCount = 0;
    for (const city of cities) {
      const coords = cityCoordinates[city.name];
      if (coords) {
        city.latitude = coords.latitude;
        city.longitude = coords.longitude;
        await city.save();
        console.log(`Updated ${city.name}: lat=${coords.latitude}, lng=${coords.longitude}`);
        updatedCount++;
      } else {
        console.log(`No coordinates found for: ${city.name}`);
      }
    }

    console.log(`\nUpdated ${updatedCount} cities with coordinates`);
    process.exit(0);
  } catch (error) {
    console.error("Error updating city coordinates:", error);
    process.exit(1);
  }
};

updateCityCoordinates();
