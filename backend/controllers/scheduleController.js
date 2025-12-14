import Schedule from "../models/schedule.js";
import Bus from "../models/bus.js";
import Route from "../models/route.js";
import Seat from "../models/seat.js";
import Booking from "../models/booking.js";
import Notification from "../models/notification.js";
import { sendScheduleChangeEmail, sendScheduleCancellationEmail } from "../config/email.js";

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

    // Track changes for notifications (only time changes, not price)
    const changes = {};
    const oldDepartureTime = schedule.departureTime;
    const oldArrivalTime = schedule.arrivalTime;

    // If changing bus, verify new bus belongs to carrier
    if (busId && busId !== schedule.busId._id.toString()) {
      const bus = await Bus.findOne({ _id: busId, carrierId: req.user._id });
      if (!bus) {
        return res.status(404).json({ message: "Bus not found or not authorized" });
      }
      schedule.busId = busId;
    }

    // Route cannot be changed after schedule creation
    if (routeId && routeId !== schedule.routeId.toString()) {
      return res.status(400).json({ message: "Route cannot be changed after schedule creation" });
    }

    if (departureTime) {
      const newDepTime = new Date(departureTime);
      if (newDepTime.getTime() !== oldDepartureTime.getTime()) {
        changes.departureTime = { old: oldDepartureTime, new: newDepTime };
      }
      schedule.departureTime = departureTime;
    }
    if (arrivalTime) {
      const newArrTime = new Date(arrivalTime);
      if (newArrTime.getTime() !== oldArrivalTime.getTime()) {
        changes.arrivalTime = { old: oldArrivalTime, new: newArrTime };
      }
      schedule.arrivalTime = arrivalTime;
    }
    // Price can be updated but we don't notify about it
    if (price !== undefined) {
      schedule.price = price;
    }

    // Validate times
    if (new Date(schedule.arrivalTime) <= new Date(schedule.departureTime)) {
      return res.status(400).json({ message: "Arrival time must be after departure time" });
    }

    await schedule.save();

    // If there are changes, notify affected passengers
    if (Object.keys(changes).length > 0) {
      try {
        // Get all confirmed and pending bookings for this schedule
        const bookings = await Booking.find({
          scheduleId: schedule._id,
          status: { $in: ["pending", "confirmed"] }
        }).populate("userId", "name email");

        // Create notifications and send emails
        for (const booking of bookings) {
          if (!booking.userId || !booking.userId.email) continue;

          // Determine notification type and message
          let notificationType = "schedule_change";
          let title = "Schedule Update";
          let message = "Your trip schedule has been updated.";

          if (changes.departureTime || changes.arrivalTime) {
            const isDelay = changes.departureTime && 
              new Date(changes.departureTime.new) > new Date(changes.departureTime.old);
            if (isDelay) {
              notificationType = "delay";
              title = "Trip Delay";
              message = "Your trip has been delayed.";
            }
          }

          // Get schedule details before creating notification
          const route = await Route.findById(schedule.routeId).populate("cityId", "name");
          const bus = await Bus.findById(schedule.busId);
          
          const fromCity = route?.cityId[0]?.name || "Unknown";
          const toCity = route?.cityId[route.cityId.length - 1]?.name || "Unknown";

          // Create notification with schedule details stored
          const notification = await Notification.create({
            userId: booking.userId._id,
            bookingId: booking._id,
            scheduleId: schedule._id,
            type: notificationType,
            title,
            message,
            changes,
            scheduleDetails: {
              from: fromCity,
              to: toCity,
              busName: bus?.busName || "Unknown",
              busNumberPlate: bus?.numberPlate || "Unknown",
              departureTime: schedule.departureTime,
              arrivalTime: schedule.arrivalTime,
            },
            isRead: false,
            emailSent: false,
          });

          // Send email notification
          try {

            await sendScheduleChangeEmail(booking.userId.email, {
              userName: booking.userId.name || booking.userId.email.split("@")[0],
              bookingId: booking._id.toString(),
              from: fromCity,
              to: toCity,
              busNumber: bus?.numberPlate || "Unknown",
              changes,
              oldDepartureTime,
              newDepartureTime: schedule.departureTime,
              oldArrivalTime,
              newArrivalTime: schedule.arrivalTime,
            });

            notification.emailSent = true;
            await notification.save();
          } catch (emailError) {
            console.error(`Error sending email for booking ${booking._id}:`, emailError);
            // Continue even if email fails
          }
        }
      } catch (notificationError) {
        console.error("Error creating notifications:", notificationError);
        // Don't fail the schedule update if notifications fail
      }
    }

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
      .populate("busId", "carrierId")
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

    // Get all affected bookings before deleting
    const bookings = await Booking.find({
      scheduleId: schedule._id,
      status: { $in: ["pending", "confirmed"] }
    }).populate("userId", "name email");

    // Notify affected passengers about cancellation
    if (bookings.length > 0) {
      try {
        const route = schedule.routeId;
        const bus = schedule.busId;
        const fromCity = route?.cityId?.[0]?.name || "Unknown";
        const toCity = route?.cityId?.[route.cityId.length - 1]?.name || "Unknown";

        for (const booking of bookings) {
          if (!booking.userId || !booking.userId.email) continue;

          // Create cancellation notification with schedule details stored
          const notification = await Notification.create({
            userId: booking.userId._id,
            bookingId: booking._id,
            scheduleId: schedule._id,
            type: "cancellation",
            title: "Trip Cancelled",
            message: "Your trip has been cancelled by the carrier.",
            changes: {},
            scheduleDetails: {
              from: fromCity,
              to: toCity,
              busName: bus?.busName || "Unknown",
              busNumberPlate: bus?.numberPlate || "Unknown",
              departureTime: schedule.departureTime,
              arrivalTime: schedule.arrivalTime,
            },
            isRead: false,
            emailSent: false,
          });

          // Send cancellation email
          try {
            await sendScheduleCancellationEmail(booking.userId.email, {
              userName: booking.userId.name || booking.userId.email.split("@")[0],
              bookingId: booking._id.toString(),
              from: fromCity,
              to: toCity,
              busNumber: bus?.numberPlate || "Unknown",
              departureTime: schedule.departureTime,
              arrivalTime: schedule.arrivalTime,
            });

            // Update notification
            await Notification.findOneAndUpdate(
              { userId: booking.userId._id, bookingId: booking._id, scheduleId: schedule._id, type: "cancellation" },
              { emailSent: true }
            );
          } catch (emailError) {
            console.error(`Error sending cancellation email for booking ${booking._id}:`, emailError);
          }

          // Cancel the booking and mark as cancelled by carrier
          booking.status = "cancelled";
          booking.cancelledByCarrier = true;
          await booking.save();
        }
      } catch (notificationError) {
        console.error("Error creating cancellation notifications:", notificationError);
        // Continue with deletion even if notifications fail
      }
    }

    await schedule.deleteOne();
    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ message: "Failed to delete schedule" });
  }
};

// @desc    Get all bookings for carrier's schedules
// @route   GET /api/carrier-schedules/bookings
// @access  Private/Carrier
const getCarrierBookings = async (req, res) => {
  try {
    // Get all buses belonging to this carrier
    const carrierBuses = await Bus.find({ carrierId: req.user._id }).select("_id");
    const busIds = carrierBuses.map(b => b._id);

    // Get all schedules for these buses
    const schedules = await Schedule.find({ busId: { $in: busIds } }).select("_id");
    const scheduleIds = schedules.map(s => s._id);

    // Get all bookings for these schedules
    const bookings = await Booking.find({ scheduleId: { $in: scheduleIds } })
      .populate("userId", "name email")
      .populate({
        path: "scheduleId",
        populate: [
          { path: "busId", select: "busName numberPlate capacity" },
          {
            path: "routeId",
            populate: { path: "cityId", select: "name" }
          }
        ]
      })
      .populate("seatId", "seatNumber")
      .sort({ createdAt: -1 });

    // Calculate occupancy for each schedule
    const bookingsWithOccupancy = bookings.map(booking => {
      const schedule = booking.scheduleId;
      const bus = schedule?.busId;

      return {
        _id: booking._id,
        passenger: {
          name: booking.userId?.name || "Unknown",
          email: booking.userId?.email || "Unknown",
        },
        schedule: {
          _id: schedule?._id,
          departureTime: schedule?.departureTime,
          arrivalTime: schedule?.arrivalTime,
          price: schedule?.price,
        },
        bus: {
          name: bus?.busName || "Unknown",
          numberPlate: bus?.numberPlate || "Unknown",
          capacity: bus?.capacity || 0,
        },
        route: schedule?.routeId ? {
          from: schedule.routeId.cityId[0]?.name || "Unknown",
          to: schedule.routeId.cityId[schedule.routeId.cityId.length - 1]?.name || "Unknown",
          distance: schedule.routeId.distance,
        } : null,
        seats: booking.seatId?.map(s => s.seatNumber) || [],
        seatsCount: booking.seatId?.length || 0,
        status: booking.status,
        isSurprise: booking.isSurprise,
        createdAt: booking.createdAt,
      };
    });

    res.json(bookingsWithOccupancy);
  } catch (error) {
    console.error("Error fetching carrier bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

export { getMySchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule, getCarrierBookings };
