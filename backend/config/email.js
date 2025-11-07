import sgMail from '@sendgrid/mail';

const sendVerificationEmail = async (email, code) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'TheLùůpa Authentication Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
          <h2>Welcome to TheLùůpa!</h2>
          <p>Your one-time login code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f2f2f2; padding: 10px 20px; border-radius: 5px; display: inline-block;">
            ${code}
          </p>
          <p>This code is valid for 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

  } catch (error) {
    console.error('Error sending verification email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
    }
    throw new Error('Failed to send confirmation email.');
  }
};

const sendCancellationEmail = async (email, bookingDetails) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Format dates before using in template
    const formattedDeparture = formatDate(bookingDetails.departureTime);
    const formattedArrival = formatDate(bookingDetails.arrivalTime);

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Booking Cancellation Confirmation - TheLùůpa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #096B8A; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">TheLùůpa</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #064d63; margin-top: 0;">Booking Cancellation Confirmed</h2>
            
            <p>Dear ${bookingDetails.userName},</p>
            
            <p>We confirm that your booking has been successfully cancelled.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #096B8A;">
              <h3 style="color: #064d63; margin-top: 0;">Booking Details:</h3>
              <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
              <p><strong>Route:</strong> ${bookingDetails.from} → ${bookingDetails.to}</p>
              <p><strong>Departure:</strong> ${formattedDeparture}</p>
              <p><strong>Arrival:</strong> ${formattedArrival}</p>
              <p><strong>Bus Number:</strong> ${bookingDetails.busNumber}</p>
              <p><strong>Seats:</strong> ${bookingDetails.seats.join(', ')}</p>
            </div>
            
            <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">Refund Information:</h3>
              <p><strong>Refund Amount:</strong> <span style="font-size: 24px; font-weight: bold; color: #2e7d32;">$${bookingDetails.refundAmount}</span></p>
              <p><strong>Payment Method:</strong> ${bookingDetails.paymentMethod}</p>
              <p style="margin-bottom: 0;">Your refund will be processed within 5-7 business days and credited back to your original payment method.</p>
            </div>
            
            <p>If you have any questions or concerns, please don't hesitate to contact our customer support.</p>
            
            <p>Thank you for choosing TheLùůpa!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The TheLùůpa Team
            </p>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

  } catch (error) {
    console.error('Error sending cancellation email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
    }
    // Don't throw error - we don't want email failure to prevent cancellation
    console.error('Failed to send cancellation email, but booking was cancelled successfully.');
  }
};

const sendBookingConfirmationEmail = async (email, bookingDetails) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Format dates before using in template
    const formattedDeparture = formatDate(bookingDetails.departureTime);
    const formattedArrival = formatDate(bookingDetails.arrivalTime);

    const isSurprise = bookingDetails.isSurprise;
    const destination = isSurprise ? "???" : bookingDetails.to;
    const distanceInfo = isSurprise ? '<p><strong>Distance:</strong> ???</p>' : `<p><strong>Distance:</strong> ${bookingDetails.distance} km</p>`;

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: isSurprise ? '🎁 Surprise Trip Booking Confirmed - TheLùůpa' : 'Booking Confirmation - TheLùůpa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #096B8A; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">TheLùůpa</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #064d63; margin-top: 0;">${isSurprise ? '🎁 Surprise Trip Booking Confirmed!' : 'Booking Confirmation'}</h2>
            
            <p>Dear ${bookingDetails.userName},</p>
            
            <p>${isSurprise ? 'Your surprise trip has been successfully booked! The destination will remain a mystery until 5 hours before departure.' : 'Your booking has been successfully confirmed.'}</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #096B8A;">
              <h3 style="color: #064d63; margin-top: 0;">Booking Details:</h3>
              <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
              <p><strong>Route:</strong> ${bookingDetails.from} → ${destination}</p>
              <p><strong>Departure:</strong> ${formattedDeparture}</p>
              <p><strong>Arrival:</strong> ${formattedArrival}</p>
              <p><strong>Bus Number:</strong> ${bookingDetails.busNumber}</p>
              <p><strong>Seats:</strong> ${bookingDetails.seats.join(', ')}</p>
              ${distanceInfo}
            </div>
            
            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
              <h3 style="color: #1565c0; margin-top: 0;">Payment Information:</h3>
              <p><strong>Total Amount:</strong> <span style="font-size: 24px; font-weight: bold; color: #1565c0;">$${bookingDetails.totalAmount}</span></p>
              <p><strong>Payment Method:</strong> ${bookingDetails.paymentMethod}</p>
              <p><strong>Payment Status:</strong> ${bookingDetails.paymentStatus}</p>
            </div>
            
            ${isSurprise ? `
            <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
              <h3 style="color: #e65100; margin-top: 0;">🎁 Surprise Trip Information:</h3>
              <p><strong>Your destination is a surprise!</strong></p>
              <p>You can reveal your destination 5 hours before departure, or wait for our reminder email 3 hours before departure when we'll automatically reveal it.</p>
              <p style="margin-bottom: 0;">Get ready for an adventure! 🚌✨</p>
            </div>
            ` : ''}
            
            <p>If you have any questions or need to make changes, please don't hesitate to contact our customer support.</p>
            
            <p>Thank you for choosing TheLùůpa!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The TheLùůpa Team
            </p>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

  } catch (error) {
    console.error('Error sending booking confirmation email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
    }
    // Don't throw error - we don't want email failure to prevent booking
    console.error('Failed to send booking confirmation email, but booking was created successfully.');
  }
};

const sendSurpriseReminderEmail = async (email, bookingDetails) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Format dates before using in template
    const formattedDeparture = formatDate(bookingDetails.departureTime);
    const formattedArrival = formatDate(bookingDetails.arrivalTime);

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: '🎁 Your Surprise Destination is Revealed! - TheLùůpa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #096B8A; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">TheLùůpa</h1>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #064d63; margin-top: 0;">🎁 Your Surprise Destination!</h2>
            
            <p>Dear ${bookingDetails.userName},</p>
            
            <p>It's time! Your departure is in 3 hours, and we're excited to reveal your surprise destination!</p>
            
            <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
              <h3 style="color: #e65100; margin-top: 0; text-align: center; font-size: 28px;">🎉 ${bookingDetails.to} 🎉</h3>
              <p style="text-align: center; font-size: 18px; color: #e65100; font-weight: bold;">Your destination has been revealed!</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #096B8A;">
              <h3 style="color: #064d63; margin-top: 0;">Complete Trip Information:</h3>
              <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
              <p><strong>Route:</strong> ${bookingDetails.from} → ${bookingDetails.to}</p>
              <p><strong>Distance:</strong> ${bookingDetails.distance} km</p>
              <p><strong>Departure:</strong> ${formattedDeparture}</p>
              <p><strong>Arrival:</strong> ${formattedArrival}</p>
              <p><strong>Bus Number:</strong> ${bookingDetails.busNumber}</p>
              <p><strong>Seats:</strong> ${bookingDetails.seats.join(', ')}</p>
            </div>
            
            <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #2e7d32; margin-top: 0;">⏰ Important Reminder:</h3>
              <p style="margin-bottom: 0;"><strong>Your bus departs in 3 hours!</strong> Please make sure you arrive at the departure point on time.</p>
            </div>
            
            <p>We hope you're excited about your trip to <strong>${bookingDetails.to}</strong>! Have a wonderful journey! 🚌✨</p>
            
            <p>Thank you for choosing TheLùůpa!</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              The TheLùůpa Team
            </p>
          </div>
          
          <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

  } catch (error) {
    console.error('Error sending surprise reminder email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
    }
    console.error('Failed to send surprise reminder email.');
  }
};

export { sendVerificationEmail, sendCancellationEmail, sendBookingConfirmationEmail, sendSurpriseReminderEmail };

