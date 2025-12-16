import { Request, Response, NextFunction } from 'express';
import { stripe, PLATFORM_FEE_PERCENTAGE } from '../config/stripe';
import Booking from '../models/Booking';
import Transaction from '../models/Transaction';
import Artisan from '../models/Artisan';

export const createPaymentIntent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Verify the user owns this booking
    if (booking.customerId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
      return;
    }

    // Check if payment already exists
    if (booking.paymentStatus === 'paid') {
      res.status(400).json({
        success: false,
        message: 'Booking already paid',
      });
      return;
    }

    // Calculate platform fee
    // const platformFee = (booking.amount * PLATFORM_FEE_PERCENTAGE) / 100;
    const amountInCents = Math.round(booking.amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        bookingId: booking._id.toString(),
        customerId: userId,
        artisanId: booking.artisanId.toString(),
      },
      // Remove application_fee_amount for now - requires Stripe Connect
      // application_fee_amount: Math.round(platformFee * 100),
    });

    // Update booking with payment intent
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    next(error);
  }
};

export const confirmPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { paymentIntentId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const bookingId = paymentIntent.metadata.bookingId;
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
        return;
      }

      // Verify the user owns this booking
      if (booking.customerId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
        return;
      }

      // Update booking payment status
      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      await booking.save();

      // Create transaction record
      const platformFee = (booking.amount * PLATFORM_FEE_PERCENTAGE) / 100;
      await Transaction.create({
        bookingId: booking._id,
        userId: booking.customerId,
        type: 'booking',
        amount: booking.amount,
        platformFee,
        netAmount: booking.amount - platformFee,
        stripePaymentIntentId: paymentIntentId,
        status: 'completed',
      });

      // Populate booking details for response
      await booking.populate([
        { path: 'customerId', select: 'name email phone avatar' },
        {
          path: 'artisanId',
          select: 'businessName category hourlyRate rating reviewCount',
          populate: { path: 'userId', select: 'name email phone avatar' },
        },
      ]);

      res.status(200).json({
        success: true,
        message: 'Payment confirmed',
        booking,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
        status: paymentIntent.status,
      });
    }
  } catch (error: any) {
    next(error);
  }
};

export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { tier } = req.body;

    const artisan = await Artisan.findOne({ userId });
    if (!artisan) {
      res.status(404).json({
        success: false,
        message: 'Artisan profile not found',
      });
      return;
    }

    const prices: Record<string, number> = {
      basic: 9.99,
      premium: 29.99,
    };

    const amount = prices[tier];
    if (!amount) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription tier',
      });
      return;
    }

    // Create payment intent for subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        // @ts-ignore
        userId,
        artisanId: artisan._id.toString(),
        subscriptionTier: tier,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount,
    });
  } catch (error: any) {
    next(error);
  }
};

export const confirmSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const { artisanId, subscriptionTier } = paymentIntent.metadata;

      const artisan = await Artisan.findById(artisanId);
      if (!artisan) {
        res.status(404).json({
          success: false,
          message: 'Artisan not found',
        });
        return;
      }

      // Verify the user owns this artisan profile
      if (artisan.userId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: 'Not authorized',
        });
        return;
      }

      // Update artisan subscription
      artisan.subscriptionTier = subscriptionTier as 'basic' | 'premium';
      artisan.subscriptionExpiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );
      await artisan.save();

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'subscription',
        amount: paymentIntent.amount / 100,
        platformFee: 0,
        netAmount: paymentIntent.amount / 100,
        stripePaymentIntentId: paymentIntentId,
        status: 'completed',
        metadata: { subscriptionTier },
      });

      res.status(200).json({
        success: true,
        message: 'Subscription activated',
        artisan,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
      });
    }
  } catch (error: any) {
    next(error);
  }
};

// OPTIONAL webhook handler - only use if you set up webhooks
export const webhookHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;

  // If no webhook secret is configured, skip webhook verification
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('Webhook secret not configured, skipping webhook');
    res.status(200).json({ received: true });
    return;
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        // Additional handling if needed
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        const booking = await Booking.findOne({
          paymentIntentId: failedIntent.id,
        });
        if (booking) {
          booking.paymentStatus = 'failed';
          await booking.save();
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};