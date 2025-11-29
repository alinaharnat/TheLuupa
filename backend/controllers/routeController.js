import Route from "../models/route.js";
import City from "../models/city.js";
import { calculateRouteDistance } from "../utils/calculateDistance.js";

// @desc    Get all routes for current carrier
// @route   GET /api/carrier-routes
// @access  Private/Carrier
const getMyRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ userId: req.user._id })
      .populate("cityId", "name latitude longitude")
      .sort({ createdAt: -1 });
    res.json(routes);
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ message: "Failed to fetch routes" });
  }
};

// @desc    Get single route by ID
// @route   GET /api/carrier-routes/:id
// @access  Private/Carrier
const getRouteById = async (req, res) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("cityId", "name latitude longitude");

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    res.json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    res.status(500).json({ message: "Failed to fetch route" });
  }
};

// @desc    Create a new route
// @route   POST /api/carrier-routes
// @access  Private/Carrier
const createRoute = async (req, res) => {
  try {
    const { cityIds } = req.body;

    if (!cityIds || cityIds.length < 2) {
      return res.status(400).json({ message: "Route must have at least 2 cities" });
    }

    // Verify all cities exist and get them in order
    const cities = await City.find({ _id: { $in: cityIds } });
    if (cities.length !== cityIds.length) {
      return res.status(400).json({ message: "One or more cities not found" });
    }

    // Sort cities in the order provided by cityIds
    const orderedCities = cityIds.map(id => cities.find(c => c._id.toString() === id));

    // Calculate distance automatically
    const distance = calculateRouteDistance(orderedCities);

    const route = await Route.create({
      userId: req.user._id,
      cityId: cityIds,
      distance,
    });

    const populatedRoute = await Route.findById(route._id).populate("cityId", "name latitude longitude");

    res.status(201).json(populatedRoute);
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({ message: "Failed to create route" });
  }
};

// @desc    Update a route
// @route   PUT /api/carrier-routes/:id
// @access  Private/Carrier
const updateRoute = async (req, res) => {
  try {
    const { cityIds } = req.body;

    const route = await Route.findOne({ _id: req.params.id, userId: req.user._id });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    if (cityIds) {
      if (cityIds.length < 2) {
        return res.status(400).json({ message: "Route must have at least 2 cities" });
      }
      // Verify all cities exist
      const cities = await City.find({ _id: { $in: cityIds } });
      if (cities.length !== cityIds.length) {
        return res.status(400).json({ message: "One or more cities not found" });
      }

      // Sort cities in the order provided by cityIds
      const orderedCities = cityIds.map(id => cities.find(c => c._id.toString() === id));

      route.cityId = cityIds;
      // Recalculate distance automatically
      route.distance = calculateRouteDistance(orderedCities);
    }

    await route.save();

    const updatedRoute = await Route.findById(route._id).populate("cityId", "name latitude longitude");
    res.json(updatedRoute);
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({ message: "Failed to update route" });
  }
};

// @desc    Delete a route
// @route   DELETE /api/carrier-routes/:id
// @access  Private/Carrier
const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, userId: req.user._id });

    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    await route.deleteOne();
    res.json({ message: "Route deleted successfully" });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ message: "Failed to delete route" });
  }
};

export { getMyRoutes, getRouteById, createRoute, updateRoute, deleteRoute };
