// backend/controllers/countryController.js
import Country from "../models/country.js";

export const getCountries = async (req, res) => {
  try {
    const countries = await Country.find();
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: "Failed to load countries" });
  }
};
