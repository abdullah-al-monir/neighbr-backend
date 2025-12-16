import { stripe } from '../config/stripe';
import Booking from '../models/Booking';
// import Transaction from '../models/Transaction';

export const createEscrowPayment = async (
  bookingId: string,
  amount: number,
  customerId: string
) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    metadata: { bookingId, customerId },
  });

  return paymentIntent;
};

export const releaseEscrow = async (bookingId: string) => {
  const booking = await Booking.findById(bookingId);
  if (!booking || !booking.paymentIntentId) {
    throw new Error('Invalid booking');
  }

  // Mark escrow as released
  booking.escrowReleased = true;
  await booking.save();

  // Transfer funds to artisan (implement Stripe Connect here)
  return true;
};

export const refundPayment = async (paymentIntentId: string) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
  });

  return refund;
};