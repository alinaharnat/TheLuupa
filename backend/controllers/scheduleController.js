import Schedule from "../models/schedule.js";
import Bus from "../models/bus.js";
import Route from "../models/route.js";
import Seat from "../models/seat.js";

// @desc    Get all schedules for current carrier
// @route   GET /api/carrier-schedules
// @access  Private/Carrier
const getMySchedules = async (req, res) => {
  try {
    // First get all buses belonging to this carrier
    const carrierBuses = await Bus.find({ carrierId: req.user._id }).select("_id");
    const busIds = carrierBuses.map(b => b._id);

    const schedules = await Schedule.find({ busId: { $in: busIds } })
      .populate("busId", "busName numberPlate")
      .populate({
        path: "routeId",
        populate: { path: "cityId", select: "name" }
      })
      .sort({ departureTime: 1 });

    res.json(schedules);
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: "Failed to fetch schedules" });
  }
};

// @desc    Get single schedule by ID
// @route   GET /api/carrier-schedules/:id
// @access  Private/Carrier
const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("busId", "busName numberPlate carrierId")
      .populate({
        path: "routeId",
        populate: { path: "cityId", select: "name" }
      });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Verify ownership
    if (schedule.busId.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ message: "Failed to fetch schedule" });
  }
};

// @desc    Create a new schedule
// @route   POST /api/carrier-schedules
// @access  Private/Carrier
const createSchedule = async (req, res) => {
  try {
    const { busId, routeId, departureTime, arrivalTime, price } = req.body;

    // Verify bus belongs to carrier
    const bus = await Bus.findOne({ _id: busId, carrierId: req.user._id });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found or not authorized" });
    }

    // Verify route belongs to carrier
    const route = await Route.findOne({ _id: routeId, userId: req.user._id });
    if (!route) {
      return res.status(404).json({ message: "Route not found or not authorized" });
    }

    // Validate times
    if (new Date(arrivalTime) <= new Date(departureTime)) {
      return res.status(400).json({ message: "Arrival time must be after departure time" });
    }

    const schedule = await Schedule.create({
      busId,
      routeId,
      departureTime,
      arrivalTime,
      price,
    });

    // Create seats for this schedule's bus if they don't exist
    const existingSeats = await Seat.countDocuments({ busId });
    if (existingSeats === 0) {
      const seats = [];
      for (let i = 1; i <= bus.capacity; i++) {
        seats.push({
          busId: bus._id,
          seatNumber: i,
          isAvailable: true,
        });
      }
      await Seat.insertMany(seats);
    }

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate("busId", "busName numberPlate")
      .populate({
        path: "routeId",
        populate: { path: "cityId", select: "name" }
      });

    res.status(201).json(populatedSchedule);
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Failed to create schedule" });
  }
};

// @desc    Update a schedule
// @route   PUT /api/carrier-schedules/:id
// @access  Private/Carrier
const updateSchedule = async (req, res) => {
  try {
    const { busId, routeId, departureTime, arrivalTime, price } = req.body;

    const schedule = await Schedule.findById(req.params.id)
      .populate("busId", "carrierId");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Verify ownership
    if (schedule.busId.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // If changing bus, verify new bus belongs to carrier
    if (busId && busId !== schedule.busId._id.toString()) {
      const bus = await Bus.findOne({ _id: busId, carrierId: req.user._id });
      if (!bus) {
        return res.status(404).json({ message: "Bus not found or not authorized" });
      }
      schedule.busId = busId;
    }

    // If changing route, verify new route belongs to carrier
    if (routeId && routeId !== schedule.routeId.toString()) {
      const route = await Route.findOne({ _id: routeId, userId: req.user._id });
      if (!route) {
        return res.status(404).json({ message: "Route not found or not authorized" });
      }
      schedule.routeId = routeId;
    }

    if (departureTime) schedule.departureTime = departureTime;
    if (arrivalTime) schedule.arrivalTime = arrivalTime;
    if (price !== undefined) schedule.price = price;

    // Validate times
    if (new Date(schedule.arrivalTime) <= new Date(schedule.departureTime)) {
      return res.status(400).json({ message: "Arrival time must be after departure time" });
    }

    await schedule.save();

    const updatedSchedule = await Schedule.findById(schedule._id)
      .populate("busId", "busName numberPlate")
      .populate({
        path: "routeId",
        populate: { path: "cityId", select: "name" }
      });

    res.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ message: "Failed to update schedule" });
  }
};

// @desc    Delete a schedule
// @route   DELETE /api/carrier-schedules/:id
// @access  Private/Carrier
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("busId", "carrierId");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Verify ownership
    if (schedule.busId.carrierId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await schedule.deleteOne();
    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Failed to delete schedule" });
  }
};

export { getMySchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule };
