import Booking from '../models/booking.js';
import Schedule from '../models/schedule.js';
import Seat from '../models/seat.js';
import Bus from '../models/bus.js';
import Route from '../models/route.js';
import City from '../models/city.js';
import Payment from '../models/payment.js';
import User from '../models/user.js';
import mongoose from 'mongoose';
import { sendCancellationEmail } from '../config/email.js';

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

    // Проверяем существование расписания
    const schedule = await Schedule.findById(scheduleId)
      .populate({
        path: 'busId',
        populate: {
          path: 'routeId',
          populate: { path: 'cityId' }
        }
      })
      .session(session);

    if (!schedule) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Проверяем, что рейс еще не отправился
    if (new Date() > schedule.departureTime) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot book seats for past trips' });
    }

    // Находим места по номерам для данного автобуса
    const seats = await Seat.find({
      busId: schedule.busId._id,
      seatNumber: { $in: seatNumbers }
    }).session(session);

    if (seats.length !== seatNumbers.length) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Some seat numbers are invalid' });
    }

    // Проверяем, что места не заняты для этого рейса
    const existingBookings = await Booking.find({
      scheduleId: scheduleId,
      status: { $in: ['pending', 'confirmed'] },
      seatId: { $in: seats.map(s => s._id) }
    }).session(session);

    if (existingBookings.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Some of the selected seats are already booked' });
    }

    // Создаем бронирование
    const booking = await Booking.create([{
      userId: userId,
      scheduleId: scheduleId,
      seatId: seats.map(s => s._id),
      status: 'pending',
      isSurprise: isSurprise === true || isSurprise === 'true',
      destinationRevealed: false
    }], { session });

    // Создаем платеж
    const totalAmount = schedule.price * seats.length;
    const payment = await Payment.create([{
      bookingId: booking[0]._id,
      amount: totalAmount,
      method: paymentMethod,
      status: 'pending'
    }], { session });

    await session.commitTransaction();

    // Получаем полную информацию о бронировании
    const fullBooking = await Booking.findById(booking[0]._id)
      .populate('userId', 'name email')
      .populate({
        path: 'scheduleId',
        populate: {
          path: 'busId',
          populate: {
            path: 'routeId',
            populate: { path: 'cityId' }
          }
        }
      })
      .populate('seatId', 'seatNumber');

    // Hide destination for surprise trips
    const isSurpriseTrip = fullBooking.isSurprise;
    const destinationRevealed = fullBooking.destinationRevealed;
    const destinationCity = fullBooking.scheduleId.busId.routeId.cityId[fullBooking.scheduleId.busId.routeId.cityId.length - 1].name;
    
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        _id: fullBooking._id,
        status: fullBooking.status,
        seats: fullBooking.seatId.map(s => s.seatNumber),
        isSurprise: isSurpriseTrip,
        destinationRevealed: destinationRevealed,
        trip: {
          from: fullBooking.scheduleId.busId.routeId.cityId[0].name,
          to: (isSurpriseTrip && !destinationRevealed) ? "???" : destinationCity,
          departureTime: fullBooking.scheduleId.departureTime,
          arrivalTime: fullBooking.scheduleId.arrivalTime,
          busNumber: fullBooking.scheduleId.busId.numberPlate
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
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
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
        populate: {
          path: 'busId',
          populate: {
            path: 'routeId',
            populate: { path: 'cityId' }
          }
        }
      })
      .populate('seatId', 'seatNumber')
      .sort({ createdAt: -1 });

    // Получаем платежи для каждого бронирования
    const bookingsWithPayments = await Promise.all(bookings.map(async (booking) => {
      const payment = await Payment.findOne({ bookingId: booking._id });
      
      // Check if destination should be hidden for surprise trips
      const isSurpriseTrip = booking.isSurprise;
      const destinationRevealed = booking.destinationRevealed;
      const destinationCity = booking.scheduleId.busId.routeId.cityId[booking.scheduleId.busId.routeId.cityId.length - 1].name;
      
      // Check if 5 hours before departure
      const hoursUntilDeparture = (new Date(booking.scheduleId.departureTime) - new Date()) / (1000 * 60 * 60);
      const canReveal = hoursUntilDeparture <= 5;

      return {
        _id: booking._id,
        status: booking.status,
        seats: booking.seatId.map(s => s.seatNumber),
        createdAt: booking.createdAt,
        isSurprise: isSurpriseTrip,
        destinationRevealed: destinationRevealed,
        canRevealDestination: isSurpriseTrip && canReveal && !destinationRevealed,
        trip: {
          from: booking.scheduleId.busId.routeId.cityId[0].name,
          to: (isSurpriseTrip && !destinationRevealed) ? "???" : destinationCity,
          departureTime: booking.scheduleId.departureTime,
          arrivalTime: booking.scheduleId.arrivalTime,
          busNumber: booking.scheduleId.busId.numberPlate,
          distance: (isSurpriseTrip && !destinationRevealed) ? null : booking.scheduleId.busId.routeId.distance
        },
        payment: payment ? {
          amount: payment.amount,
          method: payment.method,
          status: payment.status
        } : null
      };
    }));

    res.json({
      count: bookingsWithPayments.length,
      bookings: bookingsWithPayments
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
        populate: {
          path: 'busId',
          populate: {
            path: 'routeId',
            populate: { path: 'cityId' }
          }
        }
      })
      .populate('seatId', 'seatNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Проверяем, что бронирование принадлежит пользователю
    if (booking.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payment = await Payment.findOne({ bookingId: booking._id });
    
    // Check if destination should be hidden for surprise trips
    const isSurpriseTrip = booking.isSurprise;
    const destinationRevealed = booking.destinationRevealed;
    const destinationCity = booking.scheduleId.busId.routeId.cityId[booking.scheduleId.busId.routeId.cityId.length - 1].name;
    
    // Check if 5 hours before departure
    const hoursUntilDeparture = (new Date(booking.scheduleId.departureTime) - new Date()) / (1000 * 60 * 60);
    const canReveal = hoursUntilDeparture <= 5;

    res.json({
      _id: booking._id,
      status: booking.status,
      seats: booking.seatId.map(s => s.seatNumber),
      createdAt: booking.createdAt,
      isSurprise: isSurpriseTrip,
      destinationRevealed: destinationRevealed,
      canRevealDestination: isSurpriseTrip && canReveal && !destinationRevealed,
      trip: {
        from: booking.scheduleId.busId.routeId.cityId[0].name,
        to: (isSurpriseTrip && !destinationRevealed) ? "???" : destinationCity,
        departureTime: booking.scheduleId.departureTime,
        arrivalTime: booking.scheduleId.arrivalTime,
        busNumber: booking.scheduleId.busId.numberPlate,
        distance: (isSurpriseTrip && !destinationRevealed) ? null : booking.scheduleId.busId.routeId.distance
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
        populate: {
          path: 'busId',
          populate: {
            path: 'routeId',
            populate: { path: 'cityId' }
          }
        }
      })
      .populate('userId', 'name email')
      .populate('seatId', 'seatNumber')
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Проверяем, что бронирование принадлежит пользователю
    if (booking.userId._id.toString() !== userId.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Access denied' });
    }

    // Проверяем, что бронирование можно отменить
    if (booking.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Проверяем, что до отправления осталось больше 2 часов
    const hoursUntilDeparture = (booking.scheduleId.departureTime - new Date()) / (1000 * 60 * 60);
    if (hoursUntilDeparture < 2) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot cancel booking less than 2 hours before departure' });
    }

    // Get payment details before updating
    const payment = await Payment.findOne({ bookingId: booking._id }).session(session);
    const refundAmount = payment ? payment.amount : 0;
    const paymentMethod = payment ? payment.method : 'credit_card';

    // Отменяем бронирование
    booking.status = 'cancelled';
    await booking.save({ session });

    // Обновляем статус платежа
    if (payment) {
      await Payment.findOneAndUpdate(
        { bookingId: booking._id },
        { status: 'refunded' },
        { session }
      );
    }

    await session.commitTransaction();

    // Prepare booking details for email
    const route = booking.scheduleId.busId.routeId;
    const fromCity = route.cityId[0].name;
    const toCity = route.cityId[route.cityId.length - 1].name;
    const seats = booking.seatId.map(s => s.seatNumber);

    // Send cancellation email (don't wait for it to complete)
    if (booking.userId.email) {
      sendCancellationEmail(booking.userId.email, {
        userName: booking.userId.name || booking.userId.email.split('@')[0],
        bookingId: booking._id.toString(),
        from: fromCity,
        to: toCity,
        departureTime: booking.scheduleId.departureTime,
        arrivalTime: booking.scheduleId.arrivalTime,
        busNumber: booking.scheduleId.busId.numberPlate,
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

    // Получаем все места для автобуса
    const allSeats = await Seat.find({ busId: schedule.busId._id }).sort({ seatNumber: 1 });

    // Получаем забронированные места для этого рейса
    const bookings = await Booking.find({
      scheduleId: scheduleId,
      status: { $in: ['pending', 'confirmed'] }
    });

    const bookedSeatIds = bookings.flatMap(booking => booking.seatId.map(id => id.toString()));

    // Формируем список мест с их статусом
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
      .populate({
        path: 'busId',
        populate: {
          path: 'routeId',
          populate: [
            { path: 'cityId' },
            { path: 'userId', select: 'name email' }
          ]
        }
      });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const bus = schedule.busId;
    const route = bus.routeId;

    // Get available seats count
    const allSeats = await Seat.find({ busId: bus._id });
    const bookings = await Booking.find({
      scheduleId: scheduleId,
      status: { $in: ['pending', 'confirmed'] }
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

    // Проверяем, что бронирование принадлежит пользователю
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Проверяем, что это surprise trip
    if (!booking.isSurprise) {
      return res.status(400).json({ message: 'This is not a surprise trip' });
    }

    // Проверяем, что destination уже не revealed
    if (booking.destinationRevealed) {
      return res.status(400).json({ message: 'Destination already revealed' });
    }

    // Проверяем, что до отправления осталось 5 часов или меньше
    const hoursUntilDeparture = (new Date(booking.scheduleId.departureTime) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilDeparture > 5) {
      return res.status(400).json({ message: 'Destination can only be revealed 5 hours before departure' });
    }

    // Reveal destination
    booking.destinationRevealed = true;
    await booking.save();

    // Get full booking details
    const fullBooking = await Booking.findById(bookingId)
      .populate({
        path: 'scheduleId',
        populate: {
          path: 'busId',
          populate: {
            path: 'routeId',
            populate: { path: 'cityId' }
          }
        }
      })
      .populate('seatId', 'seatNumber');

    const destinationCity = fullBooking.scheduleId.busId.routeId.cityId[fullBooking.scheduleId.busId.routeId.cityId.length - 1].name;

    res.json({
      message: 'Destination revealed successfully',
      booking: {
        _id: fullBooking._id,
        isSurprise: fullBooking.isSurprise,
        destinationRevealed: fullBooking.destinationRevealed,
        trip: {
          from: fullBooking.scheduleId.busId.routeId.cityId[0].name,
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
