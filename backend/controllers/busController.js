import Bus from "../models/bus.js";

// @desc    Get all buses for current carrier
// @route   GET /api/buses
// @access  Private/Carrier
const getMyBuses = async (req, res) => {
  try {
    const buses = await Bus.find({ carrierId: req.user._id }).sort({ createdAt: -1 });
    res.json(buses);
  } catch (error) {
    console.error("Error fetching buses:", error);
    res.status(500).json({ message: "Failed to fetch buses" });
  }
};

// @desc    Get single bus by ID
// @route   GET /api/buses/:id
// @access  Private/Carrier
const getBusById = async (req, res) => {
  try {
    const bus = await Bus.findOne({ _id: req.params.id, carrierId: req.user._id });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json(bus);
  } catch (error) {
    console.error("Error fetching bus:", error);
    res.status(500).json({ message: "Failed to fetch bus" });
  }
};

// @desc    Create a new bus
// @route   POST /api/buses
// @access  Private/Carrier
const createBus = async (req, res) => {
  try {
    const { busName, numberPlate, capacity, busType, amenities } = req.body;

    // Check if bus with same number plate already exists
    const existingBus = await Bus.findOne({ numberPlate: numberPlate.toUpperCase() });
    if (existingBus) {
      return res.status(400).json({ message: "Bus with this number plate already exists" });
    }

    const bus = await Bus.create({
      carrierId: req.user._id,
      busName,
      numberPlate: numberPlate.toUpperCase(),
      capacity,
      busType: busType || "standard",
      amenities: amenities || [],
    });

    res.status(201).json(bus);
  } catch (error) {
    console.error("Error creating bus:", error);
    res.status(500).json({ message: "Failed to create bus" });
  }
};

// @desc    Update a bus
// @route   PUT /api/buses/:id
// @access  Private/Carrier
const updateBus = async (req, res) => {
  try {
    const { busName, numberPlate, capacity, busType, amenities, isActive } = req.body;

    const bus = await Bus.findOne({ _id: req.params.id, carrierId: req.user._id });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // Check if new number plate already exists (if changing)
    if (numberPlate && numberPlate.toUpperCase() !== bus.numberPlate) {
      const existingBus = await Bus.findOne({ numberPlate: numberPlate.toUpperCase() });
      if (existingBus) {
        return res.status(400).json({ message: "Bus with this number plate already exists" });
      }
    }

    bus.busName = busName || bus.busName;
    bus.numberPlate = numberPlate ? numberPlate.toUpperCase() : bus.numberPlate;
    bus.capacity = capacity || bus.capacity;
    bus.busType = busType || bus.busType;
    bus.amenities = amenities !== undefined ? amenities : bus.amenities;
    bus.isActive = isActive !== undefined ? isActive : bus.isActive;

    const updatedBus = await bus.save();
    res.json(updatedBus);
  } catch (error) {
    console.error("Error updating bus:", error);
    res.status(500).json({ message: "Failed to update bus" });
  }
};

// @desc    Delete a bus
// @route   DELETE /api/buses/:id
// @access  Private/Carrier
const deleteBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ _id: req.params.id, carrierId: req.user._id });

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    await bus.deleteOne();
    res.json({ message: "Bus deleted successfully" });
  } catch (error) {
    console.error("Error deleting bus:", error);
    res.status(500).json({ message: "Failed to delete bus" });
  }
};

export { getMyBuses, getBusById, createBus, updateBus, deleteBus };
