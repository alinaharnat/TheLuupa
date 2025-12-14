import Booking from '../models/booking.js';
import Schedule from '../models/schedule.js';
import Seat from '../models/seat.js';
import Payment from '../models/payment.js';
import mongoose from 'mongoose';
import { sendCancellationEmail, sendBookingConfirmationEmail } from '../config/email.js';
import { BOOKING, DEFAULTS } from '../config/constants.js';

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { scheduleId, seatNumbers, paymentMethod = 'credit_card', isSurprise = false } = req.body;
    const userId = req.user._id;

    if (!scheduleId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Please provide scheduleId and array of seatNumbers' });
    }

    // Check if schedule exists
    const schedule = await Schedule.findById(scheduleId)
      .populate('busId')
      .populate({
        path: 'routeId',
        populate: { path: 'cityId' }
      })
      .session(session);

    if (!schedule) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if schedule has required data
    if (!schedule.busId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Schedule is missing bus information' });
    }

    if (!schedule.routeId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Schedule is missing route information' });
    }

    // Check if trip has not departed yet
    if (new Date() > schedule.departureTime) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot book seats for past trips' });
    }

    // Find seats by numbers for this bus
    const busId = schedule.busId._id || schedule.busId;
    const seats = await Seat.find({
      busId: busId,
      seatNumber: { $in: seatNumbers }
    }).session(session);

    if (seats.length !== seatNumbers.length) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Some seat numbers are invalid' });
    }

    // Check if seats are not already booked for this trip
    // Exclude expired pending bookings
    const existingBookings = await Booking.find({
      scheduleId: scheduleId,
      seatId: { $in: seats.map(s => s._id) },
      $or: [
        { status: 'confirmed' },
        { status: 'pending', expiresAt: { $gt: new Date() } }
      ]
    }).session(session);

    if (existingBookings.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Some of the selected seats are already booked' });
    }

    // Create booking (expires if not paid)
    const expiresAt = new Date(Date.now() + BOOKING.EXPIRY_MS);
    const booking = await Booking.create([{
      userId: userId,
      scheduleId: scheduleId,
      seatId: seats.map(s => s._id),
      status: 'pending',
      expiresAt: expiresAt,
      isSurprise: isSurprise === true || isSurprise === 'true',
      destinationRevealed: false
    }], { session });

    // Create payment
    const totalAmount = schedule.price * seats.length;
    const payment = await Payment.create([{
      bookingId: booking[0]._id,
      amount: totalAmount,
      method: paymentMethod,
      status: 'pending'
    }], { session });

    await session.commitTransaction();

    // Get full booking information
    const fullBooking = await Booking.findById(booking[0]._id)
      .populate('userId', 'name email')
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId' },
          { path: 'routeId', populate: { path: 'cityId' } }
        ]
      })
      .populate('seatId', 'seatNumber');

    // Hide destination for surprise trips
    const isSurpriseTrip = fullBooking.isSurprise;
    const destinationRevealed = fullBooking.destinationRevealed;
    const route = fullBooking.scheduleId?.routeId;
    const cities = route?.cityId || [];
    const fromCity = cities[0]?.name || 'Unknown';
    const destinationCity = cities[cities.length - 1]?.name || 'Unknown';
    const bookingSeatNumbers = fullBooking.seatId?.map(s => s.seatNumber) || [];

    // Send booking confirmation email (don't wait for it to complete)
    if (fullBooking.userId?.email) {
      sendBookingConfirmationEmail(fullBooking.userId.email, {
        userName: fullBooking.userId.name || fullBooking.userId.email.split('@')[0],
        bookingId: fullBooking._id.toString(),
        from: fromCity,
        to: destinationCity,
        departureTime: fullBooking.scheduleId?.departureTime,
        arrivalTime: fullBooking.scheduleId?.arrivalTime,
        busNumber: fullBooking.scheduleId?.busId?.numberPlate || 'Unknown',
        seats: bookingSeatNumbers,
        distance: route?.distance,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        paymentStatus: payment[0].status,
        isSurprise: isSurpriseTrip
      }).catch(err => {
        console.error('Error sending booking confirmation email:', err);
        // Don't fail the request if email fails
      });
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        _id: fullBooking._id,
        status: fullBooking.status,
        seats: bookingSeatNumbers,
        isSurprise: isSurpriseTrip,
        destinationRevealed: destinationRevealed,
        trip: {
          from: fromCity,
          to: (isSurpriseTrip && !destinationRevealed) ? "???" : destinationCity,
          departureTime: fullBooking.scheduleId?.departureTime,
          arrivalTime: fullBooking.scheduleId?.arrivalTime,
          busNumber: fullBooking.scheduleId?.busId?.numberPlate || 'Unknown'
        },
        payment: {
          _id: payment[0]._id,
          amount: totalAmount,
          method: paymentMethod,
          status: payment[0].status
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Create booking error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message || 'Server error. Please try again later.' });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get user's bookings
 * @route   GET /api/bookings
 * @access  Private
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;

    const bookings = await Booking.find({ userId })
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId' },
          { path: 'routeId', populate: { path: 'cityId' } }
        ]
      })
      .populate('seatId', 'seatNumber')
      .sort({ createdAt: -1 });

    // Get payment for each booking
    const bookingsWithPayments = await Promise.all(bookings.map(async (booking) => {
      const payment = await Payment.findOne({ bookingId: booking._id });

      // Skip bookings with missing schedule or route data
      if (!booking.scheduleId || !booking.scheduleId.routeId || !booking.scheduleId.busId) {
        return null;
      }

      // Check if destination should be hidden for surprise trips
      const isSurpriseTrip = booking.isSurprise;
      const destinationRevealed = booking.destinationRevealed;
      const route = booking.scheduleId.routeId;
      const cities = route.cityId || [];

      if (cities.length === 0) {
        return null;
      }

      const fromCity = cities[0]?.name || 'Unknown';
      const destinationCity = cities[cities.length - 1]?.name || 'Unknown';

      // Check if within reveal window before departure
      const hoursUntilDeparture = (new Date(booking.scheduleId.departureTime) - new Date()) / (1000 * 60 * 60);
      const canReveal = hoursUntilDeparture <= BOOKING.HOURS_BEFORE_REVEAL_DESTINATION;

      return {
        _id: booking._id,
        status: booking.status,
        cancelledByCarrier: booking.cancelledByCarrier || false,
        expiresAt: booking.expiresAt,
        seats: booking.seatId?.map(s => s.seatNumber) || [],
        createdAt: booking.createdAt,
        isSurprise: isSurpriseTrip,
        destinationRevealed: destinationRevealed,
        canRevealDestination: isSurpriseTrip && canReveal && !destinationRevealed,
        trip: {
          from: fromCity,
          to: (isSurpriseTrip && !destinationRevealed) ? "???" : destinationCity,
          departureTime: booking.scheduleId.departureTime,
          arrivalTime: booking.scheduleId.arrivalTime,
          busNumber: booking.scheduleId.busId?.numberPlate || 'Unknown',
          distance: (isSurpriseTrip && !destinationRevealed) ? null : route.distance
        },
        payment: payment ? {
          amount: payment.amount,
          method: payment.method,
          status: payment.status
        } : null
      };
    }));

    // Filter out null bookings (those with missing data)
    const validBookings = bookingsWithPayments.filter(b => b !== null);

    res.json({
      count: validBookings.length,
      bookings: validBookings
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Get single booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId)
      .populate('userId', 'name email')
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId' },
          { path: 'routeId', populate: { path: 'cityId' } }
        ]
      })
      .populate('seatId', 'seatNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payment = await Payment.findOne({ bookingId: booking._id });

    // Check for missing schedule or route data
    if (!booking.scheduleId || !booking.scheduleId.routeId || !booking.scheduleId.busId) {
      return res.status(404).json({ message: 'Booking data incomplete' });
    }

    // Check if destination should be hidden for surprise trips
    const isSurpriseTrip = booking.isSurprise;
    const destinationRevealed = booking.destinationRevealed;
    const route = booking.scheduleId.routeId;
    const cities = route.cityId || [];
    const fromCity = cities[0]?.name || 'Unknown';
    const destinationCity = cities[cities.length - 1]?.name || 'Unknown';

    // Check if within reveal window before departure
    const hoursUntilDeparture = (new Date(booking.scheduleId.departureTime) - new Date()) / (1000 * 60 * 60);
    const canReveal = hoursUntilDeparture <= BOOKING.HOURS_BEFORE_REVEAL_DESTINATION;

    res.json({
      _id: booking._id,
      status: booking.status,
      seats: booking.seatId?.map(s => s.seatNumber) || [],
      createdAt: booking.createdAt,
      isSurprise: isSurpriseTrip,
      destinationRevealed: destinationRevealed,
      canRevealDestination: isSurpriseTrip && canReveal && !destinationRevealed,
      trip: {
        from: fromCity,
        to: (isSurpriseTrip && !destinationRevealed) ? "???" : destinationCity,
        departureTime: booking.scheduleId.departureTime,
        arrivalTime: booking.scheduleId.arrivalTime,
        busNumber: booking.scheduleId.busId?.numberPlate || 'Unknown',
        distance: (isSurpriseTrip && !destinationRevealed) ? null : route.distance
      },
      payment: payment ? {
        amount: payment.amount,
        method: payment.method,
        status: payment.status
      } : null
    });

  } catch (error) {
    console.error('Get booking by id error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Cancel booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 */
const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId' },
          { path: 'routeId', populate: { path: 'cityId' } }
        ]
      })
      .populate('userId', 'name email')
      .populate('seatId', 'seatNumber')
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.userId._id.toString() !== userId.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Check if cancellation window has passed
    const hoursUntilDeparture = (booking.scheduleId.departureTime - new Date()) / (1000 * 60 * 60);
    if (hoursUntilDeparture < BOOKING.MIN_HOURS_BEFORE_CANCEL) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Cannot cancel booking less than ${BOOKING.MIN_HOURS_BEFORE_CANCEL} hours before departure` });
    }

    // Get payment details before updating
    const payment = await Payment.findOne({ bookingId: booking._id }).session(session);
    const refundAmount = payment ? payment.amount : 0;
    const paymentMethod = payment ? payment.method : 'credit_card';

    // Cancel booking
    booking.status = 'cancelled';
    await booking.save({ session });

    // Update payment status
    if (payment) {
      await Payment.findOneAndUpdate(
        { bookingId: booking._id },
        { status: 'refunded' },
        { session }
      );
    }

    await session.commitTransaction();

    // Prepare booking details for email (with null checks)
    const route = booking.scheduleId?.routeId;
    const cities = route?.cityId || [];
    const fromCity = cities[0]?.name || 'Unknown';
    const toCity = cities[cities.length - 1]?.name || 'Unknown';
    const seats = booking.seatId?.map(s => s.seatNumber) || [];

    // Send cancellation email (don't wait for it to complete)
    if (booking.userId?.email) {
      sendCancellationEmail(booking.userId.email, {
        userName: booking.userId.name || booking.userId.email.split('@')[0],
        bookingId: booking._id.toString(),
        from: fromCity,
        to: toCity,
        departureTime: booking.scheduleId?.departureTime,
        arrivalTime: booking.scheduleId?.arrivalTime,
        busNumber: booking.scheduleId?.busId?.numberPlate || 'Unknown',
        seats: seats,
        refundAmount: refundAmount,
        paymentMethod: paymentMethod.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      }).catch(err => {
        console.error('Error sending cancellation email:', err);
        // Don't fail the request if email fails
      });
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking: {
        _id: booking._id,
        status: booking.status
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get available seats for schedule
 * @route   GET /api/bookings/schedule/:scheduleId/seats
 * @access  Public
 */
const getAvailableSeats = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId).populate('busId');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Get all seats for the bus
    const allSeats = await Seat.find({ busId: schedule.busId._id }).sort({ seatNumber: 1 });

    // Get booked seats for this trip (exclude expired pending)
    const bookings = await Booking.find({
      scheduleId: scheduleId,
      $or: [
        { status: 'confirmed' },
        { status: 'pending', expiresAt: { $gt: new Date() } }
      ]
    });

    const bookedSeatIds = bookings.flatMap(booking => booking.seatId.map(id => id.toString()));

    // Build seats list with their status
    const seats = allSeats.map(seat => ({
      _id: seat._id,
      seatNumber: seat.seatNumber,
      isAvailable: !bookedSeatIds.includes(seat._id.toString())
    }));

    res.json({
      totalSeats: seats.length,
      availableSeats: seats.filter(s => s.isAvailable).length,
      seats: seats
    });

  } catch (error) {
    console.error('Get available seats error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Get schedule details by ID
 * @route   GET /api/bookings/schedule/:scheduleId
 * @access  Public
 */
const getScheduleDetails = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const isSurprise = req.query.surprise === 'true';

    const schedule = await Schedule.findById(scheduleId)
      .populate('busId')
      .populate({
        path: 'routeId',
        populate: [
          { path: 'cityId' },
          { path: 'userId', select: 'name email' }
        ]
      });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const bus = schedule.busId;
    const route = schedule.routeId;

    // Get available seats count (exclude expired pending)
    const allSeats = await Seat.find({ busId: bus._id });
    const bookings = await Booking.find({
      scheduleId: scheduleId,
      $or: [
        { status: 'confirmed' },
        { status: 'pending', expiresAt: { $gt: new Date() } }
      ]
    });

    const bookedSeatIds = bookings.flatMap(booking => booking.seatId.map(id => id.toString()));
    const availableSeats = allSeats.filter(seat => !bookedSeatIds.includes(seat._id.toString()));

    const destinationCity = route.cityId[route.cityId.length - 1].name;

    res.json({
      scheduleId: schedule._id,
      busNumber: bus.numberPlate,
      carrier: route.userId.name,
      carrierEmail: route.userId.email,
      route: {
        from: route.cityId[0].name,
        to: isSurprise ? "???" : destinationCity,
        cities: route.cityId.map(city => city.name),
        distance: isSurprise ? null : route.distance
      },
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      price: schedule.price,
      availableSeats: availableSeats.length,
      totalSeats: allSeats.length,
      isSurprise: isSurprise
    });

  } catch (error) {
    console.error('Get schedule details error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

/**
 * @desc    Reveal destination for surprise trip
 * @route   PUT /api/bookings/:id/reveal-destination
 * @access  Private
 */
const revealDestination = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId)
      .populate('scheduleId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if this is a surprise trip
    if (!booking.isSurprise) {
      return res.status(400).json({ message: 'This is not a surprise trip' });
    }

    // Check if destination is already revealed
    if (booking.destinationRevealed) {
      return res.status(400).json({ message: 'Destination already revealed' });
    }

    // Check if within reveal window before departure
    const hoursUntilDeparture = (new Date(booking.scheduleId.departureTime) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilDeparture > BOOKING.HOURS_BEFORE_REVEAL_DESTINATION) {
      return res.status(400).json({ message: `Destination can only be revealed ${BOOKING.HOURS_BEFORE_REVEAL_DESTINATION} hours before departure` });
    }

    // Reveal destination
    booking.destinationRevealed = true;
    await booking.save();

    // Get full booking details
    const fullBooking = await Booking.findById(bookingId)
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId' },
          { path: 'routeId', populate: { path: 'cityId' } }
        ]
      })
      .populate('seatId', 'seatNumber');

    const route = fullBooking.scheduleId?.routeId;
    const cities = route?.cityId || [];
    const fromCity = cities[0]?.name || 'Unknown';
    const destinationCity = cities[cities.length - 1]?.name || 'Unknown';

    res.json({
      message: 'Destination revealed successfully',
      booking: {
        _id: fullBooking._id,
        isSurprise: fullBooking.isSurprise,
        destinationRevealed: fullBooking.destinationRevealed,
        trip: {
          from: fromCity,
          to: destinationCity
        }
      }
    });

  } catch (error) {
    console.error('Reveal destination error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getAvailableSeats,
  getScheduleDetails,
  revealDestination
};
