import City from "../models/city.js";
import Country from "../models/country.js";

export const getCities = async (req, res) => {
  try {
    const cities = await City.find()
      .populate("countryId", "name") // <-- додаємо country name

    const formatted = cities.map(c => ({
      _id: c._id,
      name: c.name,
      country: c.countryId?.name || ""
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to load cities" });
  }
};
