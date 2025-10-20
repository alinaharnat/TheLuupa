//controllers/searchController.js
import City from '../models/city.js';
import Route from '../models/route.js';
import Bus from '../models/bus.js';
import Schedule from '../models/schedule.js';
import Seat from '../models/seat.js';
import Booking from '../models/booking.js';

/**
 * @desc    Search for available trips
 * @route   POST /api/search
 * @access  Public
 */
const searchTrips = async (req, res) => {
  try {
    const { from, to, date, passengers = 1 } = req.body;

    if (!from || !to || !date) {
      return res.status(400).json({ message: 'Please provide from, to, and date parameters' });
    }

    // Find cities by name (case-insensitive)
    const fromCity = await City.findOne({ name: new RegExp(`^${from}$`, 'i') });
    const toCity = await City.findOne({ name: new RegExp(`^${to}$`, 'i') });

    if (!fromCity || !toCity) {
      return res.status(404).json({ message: 'One or both cities not found' });
    }

    // Find routes that contain both cities
    const routes = await Route.find({
      cityId: { $all: [fromCity._id, toCity._id] }
    }).populate('cityId', 'name').populate('userId', 'name email');

    // Filter routes where 'from' city comes before 'to' city
    const validRoutes = routes.filter(route => {
      const fromIndex = route.cityId.findIndex(city => city._id.toString() === fromCity._id.toString());
      const toIndex = route.cityId.findIndex(city => city._id.toString() === toCity._id.toString());
      return fromIndex < toIndex;
    });

    if (validRoutes.length === 0) {
      return res.status(404).json({ message: 'No routes found for this trip' });
    }

    // Get all buses for these routes
    const routeIds = validRoutes.map(route => route._id);
    const buses = await Bus.find({ routeId: { $in: routeIds } }).populate('routeId');

    if (buses.length === 0) {
      return res.status(404).json({ message: 'No buses available for this route' });
    }

    // Get schedules for these buses on the specified date
    const busIds = buses.map(bus => bus._id);
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999));

    const schedules = await Schedule.find({
      busId: { $in: busIds },
      departureTime: { $gte: startOfDay, $lte: endOfDay }
    }).populate('busId');

    if (schedules.length === 0) {
      return res.status(404).json({ message: 'No trips available on this date' });
    }

    // For each schedule, calculate available seats
    const results = await Promise.all(schedules.map(async (schedule) => {
      const bus = schedule.busId;

      // Get all seats for this bus
      const allSeats = await Seat.find({ busId: bus._id });

      // Get booked seats for this schedule
      const bookings = await Booking.find({
        scheduleId: schedule._id,
        status: { $in: ['pending', 'confirmed'] }
      });

      const bookedSeatIds = bookings.flatMap(booking => booking.seatId.map(id => id.toString()));
      const availableSeats = allSeats.filter(seat => !bookedSeatIds.includes(seat._id.toString()));

      // Only return if enough seats available
      if (availableSeats.length < passengers) {
        return null;
      }

      // Get route details
      const route = validRoutes.find(r => r._id.toString() === bus.routeId._id.toString());

      // Find indices of from and to cities in the route
      const fromIndex = route.cityId.findIndex(city => city._id.toString() === fromCity._id.toString());
      const toIndex = route.cityId.findIndex(city => city._id.toString() === toCity._id.toString());

      return {
        scheduleId: schedule._id,
        busNumber: bus.numberPlate,
        carrier: route.userId.name,
        carrierEmail: route.userId.email,
        route: {
          from: route.cityId[fromIndex].name,
          to: route.cityId[toIndex].name,
          cities: route.cityId.map(city => city.name),
          distance: route.distance
        },
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        price: schedule.price,
        availableSeats: availableSeats.length,
        totalSeats: allSeats.length
      };
    }));

    // Filter out null results and sort by departure time
    const availableTrips = results.filter(trip => trip !== null).sort((a, b) =>
      new Date(a.departureTime) - new Date(b.departureTime)
    );

    if (availableTrips.length === 0) {
      return res.status(404).json({ message: 'No trips with enough available seats found' });
    }

    res.json({
      count: availableTrips.length,
      trips: availableTrips
    });

  } catch (error) {
    console.error('Search trips error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export { searchTrips };
