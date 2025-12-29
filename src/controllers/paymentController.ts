import { Request, Response, NextFunction } from "express";
import { stripe } from "../config/stripe";
import Booking from "../models/Booking";
import Transaction from "../models/Transaction";
import Artisan from "../models/Artisan";
import { getPlatformFeeByTier } from "./platformFeeController";
import {
  createNotification,
  NotificationTemplates,
} from "../services/notificationService";

// ============================================
// BOOKING PAYMENT FUNCTIONS
// ============================================

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
        message: "Booking not found",
      });
      return;
    }

    // Verify the user owns this booking
    if (booking.customerId.toString() !== userId) {
      res.status(403).json({
        success: false,
        message: "Not authorized",
      });
      return;
    }

    // Check if payment already exists
    if (booking.paymentStatus === "paid") {
      res.status(400).json({
        success: false,
        message: "Booking already paid",
      });
      return;
    }

    // 🔥 GET ARTISAN'S SUBSCRIPTION TIER TO CALCULATE PLATFORM FEE
    const artisan = await Artisan.findById(booking.artisanId);
    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan not found",
      });
      return;
    }

    // 🔥 GET DYNAMIC PLATFORM FEE BASED ON ARTISAN'S TIER
    const platformFeePercentage = await getPlatformFeeByTier(
      artisan.subscriptionTier
    );
    const platformFee = (booking.amount * platformFeePercentage) / 100;

    const amountInCents = Math.round(booking.amount * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        bookingId: booking._id.toString(),
        customerId: userId,
        artisanId: booking.artisanId.toString(),
        // 🔥 STORE PLATFORM FEE INFO IN METADATA
        platformFeePercentage: platformFeePercentage.toString(),
        platformFee: platformFee.toFixed(2),
        subscriptionTier: artisan.subscriptionTier,
      },
    });

    // Update booking with payment intent
    booking.paymentIntentId = paymentIntent.id;
    await booking.save();

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      // 🔥 RETURN FEE INFO TO FRONTEND (OPTIONAL - FOR DISPLAY)
      platformFeePercentage,
      platformFee: platformFee.toFixed(2),
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

    if (paymentIntent.status === "succeeded") {
      const bookingId = paymentIntent.metadata.bookingId;
      const booking = await Booking.findById(bookingId);

      if (!booking) {
        res.status(404).json({
          success: false,
          message: "Booking not found",
        });
        return;
      }

      // Verify the user owns this booking
      if (booking.customerId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: "Not authorized",
        });
        return;
      }

      // Update booking payment status
      booking.paymentStatus = "paid";
      booking.status = "confirmed";
      await booking.save();

      // 🔥 GET PLATFORM FEE FROM PAYMENT INTENT METADATA
      const platformFeePercentage = parseFloat(
        paymentIntent.metadata.platformFeePercentage || "10"
      );
      const platformFee = (booking.amount * platformFeePercentage) / 100;

      // 🔥 CREATE TRANSACTION RECORD WITH DYNAMIC FEE
      await Transaction.create({
        bookingId: booking._id,
        userId: booking.customerId,
        type: "booking",
        amount: booking.amount,
        platformFee,
        netAmount: booking.amount - platformFee,
        stripePaymentIntentId: paymentIntentId,
        status: "completed",
        metadata: {
          platformFeePercentage,
          subscriptionTier: paymentIntent.metadata.subscriptionTier || "free",
        },
      });

      // Populate booking details for response
      await booking.populate([
        { path: "customerId", select: "name email phone avatar" },
        {
          path: "artisanId",
          select:
            "businessName category hourlyRate rating reviewCount subscriptionTier",
          populate: { path: "userId", select: "name email phone avatar" },
        },
      ]);

      // NOTIFY CUSTOMER - Payment confirmed
      await createNotification({
        userId: booking.customerId._id,
        ...NotificationTemplates.paymentConfirmed(
          booking.amount,
          booking._id.toString()
        ),
      });

      // NOTIFY ARTISAN - Payment received
      const customerName = (booking.customerId as any).name;
      await createNotification({
        userId: (booking.artisanId as any).userId._id,
        ...NotificationTemplates.paymentReceived(
          customerName,
          booking.amount,
          booking._id.toString()
        ),
      });

      res.status(200).json({
        success: true,
        message: "Payment confirmed",
        booking,
        // 🔥 RETURN FEE INFO (OPTIONAL - FOR DISPLAY)
        platformFee: platformFee.toFixed(2),
        platformFeePercentage,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not successful",
        status: paymentIntent.status,
      });
    }
  } catch (error: any) {
    next(error);
  }
};

// ============================================
// SUBSCRIPTION PAYMENT FUNCTIONS
// ============================================

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
        message: "Artisan profile not found",
      });
      return;
    }

    // 🔥 FETCH SUBSCRIPTION PLAN FROM DATABASE (NOT HARDCODED)
    const SubscriptionSettings =
      require("../models/SubscriptionSettings").default;

    const plan = await SubscriptionSettings.findOne({ tier, isActive: true });
    if (!plan) {
      res.status(404).json({
        success: false,
        message: "Subscription plan not found or inactive",
      });
      return;
    }

    // 🔥 GET THE NEW PLATFORM FEE FOR THIS TIER
    const newPlatformFee = await getPlatformFeeByTier(tier);

    // Create payment intent for subscription
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: "usd",
      metadata: {
        artisanId: artisan._id.toString(),
        subscriptionTier: tier,
        duration: plan.duration.toString(),
        platformFeePercentage: newPlatformFee.toString(),
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: plan.price,
      duration: plan.duration,
      newPlatformFeePercentage: newPlatformFee,
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

    if (paymentIntent.status === "succeeded") {
      const { artisanId, subscriptionTier, duration } = paymentIntent.metadata;

      const artisan = await Artisan.findById(artisanId);
      if (!artisan) {
        res.status(404).json({
          success: false,
          message: "Artisan not found",
        });
        return;
      }

      // Verify the user owns this artisan profile
      if (artisan.userId.toString() !== userId) {
        res.status(403).json({
          success: false,
          message: "Not authorized",
        });
        return;
      }

      // 🔥 UPDATE ARTISAN SUBSCRIPTION WITH DURATION FROM DATABASE
      artisan.subscriptionTier = subscriptionTier as "basic" | "premium";
      artisan.subscriptionExpiresAt = new Date(
        Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000
      );
      await artisan.save();

      // Create transaction record
      await Transaction.create({
        userId,
        type: "subscription",
        amount: paymentIntent.amount / 100,
        platformFee: 0, // No platform fee on subscription purchases
        netAmount: paymentIntent.amount / 100,
        stripePaymentIntentId: paymentIntentId,
        status: "completed",
        metadata: {
          subscriptionTier,
          duration: parseInt(duration),
          // 🔥 STORE NEW PLATFORM FEE PERCENTAGE
          newPlatformFeePercentage:
            paymentIntent.metadata.platformFeePercentage,
        },
      });

      await createNotification({
        userId: artisan.userId,
        ...NotificationTemplates.subscriptionActivated(
          subscriptionTier,
          parseInt(duration),
          parseFloat(paymentIntent.metadata.platformFeePercentage)
        ),
      });
      res.status(200).json({
        success: true,
        message: "Subscription activated",
        artisan,
        //  SHOW ARTISAN THEIR NEW COMMISSION RATE
        newPlatformFeePercentage: paymentIntent.metadata.platformFeePercentage,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment not successful",
      });
    }
  } catch (error: any) {
    next(error);
  }
};

// ============================================
// WEBHOOK HANDLER
// ============================================

export const webhookHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  const sig = req.headers["stripe-signature"] as string;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log("Webhook secret not configured, skipping webhook");
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
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);
        // Additional handling if needed
        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        const booking = await Booking.findOne({
          paymentIntentId: failedIntent.id,
        });
        if (booking) {
          booking.paymentStatus = "failed";
          await booking.save();
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};
