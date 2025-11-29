import Booking from '../models/booking.js';
import Payment from '../models/payment.js';
import { sendSurpriseReminderEmail } from './email.js';

/**
 * Clean up expired pending bookings
 * Runs every minute to check for bookings that have expired
 */
const cleanupExpiredBookings = async () => {
  try {
    const now = new Date();

    // Find all expired pending bookings
    const expiredBookings = await Booking.find({
      status: 'pending',
      expiresAt: { $lte: now }
    });

    if (expiredBookings.length > 0) {
      console.log(`Found ${expiredBookings.length} expired pending bookings to clean up`);

      for (const booking of expiredBookings) {
        try {
          // Update booking status to expired
          booking.status = 'expired';
          await booking.save();

          // Update payment status to failed
          await Payment.findOneAndUpdate(
            { bookingId: booking._id },
            { status: 'failed' }
          );

          console.log(`Expired booking ${booking._id} - seats released`);
        } catch (error) {
          console.error(`Error expiring booking ${booking._id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error in cleanupExpiredBookings:', error);
  }
};

/**
 * Check for surprise trips that are 3 hours before departure
 * and send reminder emails with destination revealed
 */
const checkSurpriseReminders = async () => {
  try {
    const now = new Date();
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
    const threeHoursAndOneMinuteFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000 + 60 * 1000); // 3 hours 1 minute from now

    // Find surprise trips that:
    // 1. Are surprise trips
    // 2. Reminder email hasn't been sent yet
    // 3. Booking is not cancelled
    const bookings = await Booking.find({
      isSurprise: true,
      reminderEmailSent: false,
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('userId', 'name email')
      .populate({
        path: 'scheduleId',
        populate: [
          { path: 'busId' },
          { path: 'routeId', populate: { path: 'cityId' } }
        ]
      })
      .populate('seatId', 'seatNumber');

    // Filter bookings where departure is between 3 hours and 3 hours 1 minute from now
    const bookingsToRemind = bookings.filter(booking => {
      if (!booking.scheduleId || !booking.scheduleId.departureTime) {
        return false;
      }
      const departureTime = new Date(booking.scheduleId.departureTime);
      return departureTime >= threeHoursFromNow && departureTime <= threeHoursAndOneMinuteFromNow;
    });

    console.log(`Found ${bookingsToRemind.length} surprise trips to send reminder emails for`);

    for (const booking of bookingsToRemind) {
      try {
        if (!booking.userId || !booking.userId.email) {
          console.log(`Skipping booking ${booking._id} - no user email`);
          continue;
        }

        const route = booking.scheduleId?.routeId;
        if (!route || !route.cityId || route.cityId.length === 0) {
          console.log(`Skipping booking ${booking._id} - no route data`);
          continue;
        }

        const fromCity = route.cityId[0]?.name || 'Unknown';
        const toCity = route.cityId[route.cityId.length - 1]?.name || 'Unknown';
        const seats = booking.seatId?.map(s => s.seatNumber) || [];

        // Send reminder email
        await sendSurpriseReminderEmail(booking.userId.email, {
          userName: booking.userId.name || booking.userId.email.split('@')[0],
          bookingId: booking._id.toString(),
          from: fromCity,
          to: toCity,
          departureTime: booking.scheduleId?.departureTime,
          arrivalTime: booking.scheduleId?.arrivalTime,
          busNumber: booking.scheduleId?.busId?.numberPlate || 'Unknown',
          seats: seats,
          distance: route.distance
        });

        // Mark reminder email as sent and reveal destination
        booking.reminderEmailSent = true;
        booking.destinationRevealed = true; // Automatically reveal destination when reminder is sent
        await booking.save();

        console.log(`Sent reminder email for booking ${booking._id}`);
      } catch (error) {
        console.error(`Error sending reminder email for booking ${booking._id}:`, error);
        // Continue with other bookings even if one fails
      }
    }
  } catch (error) {
    console.error('Error in checkSurpriseReminders:', error);
  }
};

// Start all cron jobs
const startCronJobs = () => {
  console.log('Starting cron jobs...');

  // Cleanup expired bookings - run every minute
  console.log('  - Expired bookings cleanup (every 1 min)');
  cleanupExpiredBookings(); // Run immediately
  setInterval(cleanupExpiredBookings, 60 * 1000); // Every minute

  // Surprise reminder emails - run every 5 minutes
  console.log('  - Surprise reminder emails (every 5 min)');
  checkSurpriseReminders(); // Run immediately
  setInterval(checkSurpriseReminders, 5 * 60 * 1000); // Every 5 minutes

  console.log('Cron jobs started successfully');
};

export default startCronJobs;

