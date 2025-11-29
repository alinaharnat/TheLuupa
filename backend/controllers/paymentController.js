import Stripe from 'stripe';
import Booking from '../models/booking.js';
import Payment from '../models/payment.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc Create Stripe checkout session
 * @route POST /api/payments/create-session
 * @access Private
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId).populate('seatId').populate('scheduleId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const payment = await Payment.findOne({ bookingId });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Bus Trip #${booking.scheduleId._id}`,
          },
          unit_amount: Math.round(payment.amount * 100 / booking.seatId.length)
        },
        quantity: booking.seatId.length
      }],
      // Pass session_id to success URL for verification
      success_url: `${process.env.FRONTEND_URL}/my-tickets?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/my-tickets?payment_cancelled=true`,
      metadata: {
        bookingId: bookingId,
        userId: userId.toString()
      }
    });

    // Store session ID in payment for verification
    payment.stripeSessionId = session.id;
    await payment.save();

    res.json({ url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ message: 'Stripe session creation failed' });
  }
};

/**
 * @desc Verify payment after Stripe redirect (for localhost without webhooks)
 * @route POST /api/payments/verify
 * @access Private
 */
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID required' });
    }

    // Find payment by session ID
    const payment = await Payment.findOne({ stripeSessionId: sessionId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // If already processed, return current status
    if (payment.status === 'successful') {
      return res.json({ status: 'already_confirmed', payment });
    }

    // Retrieve session from Stripe to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // Update payment and booking status
      payment.status = 'successful';
      await payment.save();

      await Booking.findByIdAndUpdate(payment.bookingId, { status: 'confirmed' });

      console.log(`✅ Payment verified for booking ${payment.bookingId}`);
      return res.json({ status: 'confirmed', payment });
    } else if (session.status === 'expired') {
      payment.status = 'failed';
      await payment.save();
      await Booking.findByIdAndUpdate(payment.bookingId, { status: 'failed' });
      return res.json({ status: 'expired', payment });
    }

    return res.json({ status: session.payment_status, payment });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.metadata.bookingId;

        console.log(`✅ Payment successful for booking ${bookingId}`);

        await Payment.findOneAndUpdate(
          { bookingId },
          { status: 'successful' }
        );
        await Booking.findByIdAndUpdate(bookingId, { status: 'confirmed' });
        break;
      }

      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired':
      case 'checkout.session.canceled': {
        const session = event.data.object;
        const bookingId = session.metadata.bookingId;

        console.log(`⚠️ Payment failed or canceled for booking ${bookingId}`);

        await Payment.findOneAndUpdate(
          { bookingId },
          { status: 'failed' }
        );
        await Booking.findByIdAndUpdate(bookingId, { status: 'failed' });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('💥 Webhook processing error:', err);
    res.status(500).json({ error: 'Webhook internal error' });
  }
};