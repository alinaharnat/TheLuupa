import Schedule from "../models/schedule.js";
import Bus from "../models/bus.js";
import Route from "../models/route.js";
import City from "../models/city.js";

export const searchSurprise = async (req, res) => {
  try {
    const { from, date, passengers, maxPrice, duration, timeOfDay } = req.body;

    if (!from || !date) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // 🔍 Фільтруємо розклади за датою
    // Create date range for the selected date (start and end of day)
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    let schedules = await Schedule.find({
      departureTime: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      ...(maxPrice && { price: { $lte: maxPrice } }),
    })
      .populate("busId")
      .populate({
        path: "routeId",
        populate: { path: "cityId" },
      });

    // Фільтр: маршрут починається з обраного міста
    // Extract city name from the "from" field (could be "City, Country" or just "City")
    const cityName = from.split(',')[0].trim().toLowerCase();
    schedules = schedules.filter((schedule) => {
      const cities = schedule.routeId?.cityId;
      if (!cities || cities.length === 0) return false;
      return cities[0].name.toLowerCase() === cityName;
    });

    // Фільтр: duration (by travel hours)
    if (duration && duration !== "any") {
      schedules = schedules.filter((s) => {
        const hours = (new Date(s.arrivalTime) - new Date(s.departureTime)) / (1000 * 60 * 60);
        if (duration === "short") return hours <= 4;
        if (duration === "medium") return hours > 4 && hours <= 8;
        if (duration === "long") return hours > 8;
        return true;
      });
    }

    // Фільтр: time of day
    if (timeOfDay && timeOfDay !== "any") {
      schedules = schedules.filter((s) => {
        const hour = new Date(s.departureTime).getHours();
        if (timeOfDay === "morning") return hour >= 6 && hour < 12;
        if (timeOfDay === "afternoon") return hour >= 12 && hour < 18;
        if (timeOfDay === "evening") return hour >= 18 && hour < 22;
        if (timeOfDay === "night") return hour >= 22 || hour < 6;
        return true;
      });
    }

    if (!schedules.length) {
      return res.status(404).json({ message: "No matching surprise trips found" });
    }

    // 🎁 Вибираємо випадковий елемент зі списку
    const randomTrip = schedules[Math.floor(Math.random() * schedules.length)];

    const route = randomTrip.routeId;
    return res.json({
      message: "Surprise trip found!",
      trip: {
        scheduleId: randomTrip._id,
        departureTime: randomTrip.departureTime,
        arrivalTime: randomTrip.arrivalTime,
        price: randomTrip.price,
        busNumber: randomTrip.busId.numberPlate,
        from: route.cityId[0].name,
        to: route.cityId[route.cityId.length - 1].name,
      },
    });
  } catch (error) {
    console.error("Surprise search error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getPriceRange = async (req, res) => {
  try {
    const prices = await Schedule.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" }
        }
      }
    ]);

    res.json(prices[0] || { minPrice: 0, maxPrice: 500 });
  } catch (error) {
    res.status(500).json({ message: "Failed to load price range" });
  }
};