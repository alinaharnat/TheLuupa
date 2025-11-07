import Booking from '../models/booking.js';
import { sendSurpriseReminderEmail } from './email.js';

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
        populate: {
          path: 'busId',
          populate: {
            path: 'routeId',
            populate: { path: 'cityId' }
          }
        }
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

        const route = booking.scheduleId.busId.routeId;
        const fromCity = route.cityId[0].name;
        const toCity = route.cityId[route.cityId.length - 1].name;
        const seats = booking.seatId.map(s => s.seatNumber);

        // Send reminder email
        await sendSurpriseReminderEmail(booking.userId.email, {
          userName: booking.userId.name || booking.userId.email.split('@')[0],
          bookingId: booking._id.toString(),
          from: fromCity,
          to: toCity,
          departureTime: booking.scheduleId.departureTime,
          arrivalTime: booking.scheduleId.arrivalTime,
          busNumber: booking.scheduleId.busId.numberPlate,
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

// Run the check every 5 minutes
const startSurpriseReminderCron = () => {
  console.log('Starting surprise reminder email cron job...');
  
  // Run immediately on start
  checkSurpriseReminders();
  
  // Then run every 5 minutes
  setInterval(checkSurpriseReminders, 5 * 60 * 1000); // 5 minutes in milliseconds
};

export default startSurpriseReminderCron;

