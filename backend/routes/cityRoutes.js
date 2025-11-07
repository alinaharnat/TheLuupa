import express from "express";
import City from "../models/city.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const cities = await City.find().populate("countryId", "name");
    res.json(
      cities.map((c) => {
        // Handle populated countryId - it could be an object with name, or null/undefined
        const countryName = c.countryId && typeof c.countryId === 'object' && c.countryId.name 
          ? c.countryId.name 
          : "";
        
        return {
          _id: c._id,
          name: c.name,
          country: countryName,
        };
      })
    );
  } catch (err) {
    res.status(500).json({ message: "Failed to load cities" });
  }
});

export default router;
