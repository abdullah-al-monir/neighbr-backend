import { Request, Response, NextFunction } from "express";
import Booking from "../models/Booking";
import Artisan from "../models/Artisan";
import { stripe } from "../config/stripe";
import Review from "../models/Review";
import { sendBookingConfirmation } from "../services/emailService";
import {
  createNotification,
  NotificationTemplates,
} from "../services/notificationService";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.user?.userId;
    const {
      artisanId,
      serviceType,
      description,
      scheduledDate,
      timeSlot,
      location,
      notes,
    } = req.body;

    // Get artisan details
    const artisan = await Artisan.findById(artisanId);
    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan not found",
      });
      return;
    }

    if (!artisan.verified) {
      res.status(400).json({
        success: false,
        message: "Artisan is not verified",
      });
      return;
    }

    // Calculate booking duration and amount
    const startTime = timeSlot.start.split(":");
    const endTime = timeSlot.end.split(":");
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    const durationHours = (endMinutes - startMinutes) / 60;
    let amount = durationHours * artisan.hourlyRate;
    amount = Number(amount.toFixed(2));

    // Create booking
    const booking = await Booking.create({
      customerId,
      artisanId,
      serviceType,
      description,
      scheduledDate,
      timeSlot,
      amount,
      location,
      notes,
      status: "pending",
      paymentStatus: "pending",
    });

    await booking.populate([
      { path: "customerId", select: "name email phone avatar" },
      {
        path: "artisanId",
        select: "businessName category hourlyRate rating reviewCount",
        populate: { path: "userId", select: "name email phone avatar" },
      },
    ]);

    // Send booking confirmation email
    try {
      const customerEmail = (booking.customerId as any).email;
      await sendBookingConfirmation(customerEmail, {
        serviceType: booking.serviceType,
        scheduledDate: booking.scheduledDate,
        timeSlot: booking.timeSlot,
        amount: booking.amount,
      });
    } catch (emailError) {
      console.error("Failed to send booking confirmation email:", emailError);
    }

    //  NOTIFY ARTISAN about new booking request
    const customerName = (booking.customerId as any).name;
    await createNotification({
      userId: (artisan.userId as any)._id,
      ...NotificationTemplates.newBookingRequest(
        customerName,
        serviceType,
        booking._id.toString(),
        amount
      ),
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const booking = await Booking.findById(id).populate([
      { path: "customerId", select: "name email phone avatar" },
      {
        path: "artisanId",
        select: "businessName category hourlyRate rating reviewCount",
        populate: { path: "userId", select: "name email phone avatar" },
      },
    ]);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check authorization
    const artisan = await Artisan.findById(booking.artisanId);
    if (
      booking.customerId._id.toString() !== userId &&
      artisan?.userId.toString() !== userId &&
      req.user?.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to access this booking",
      });
      return;
    }

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getMyBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    console.log(userId);
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = {
      customerId: userId,
      status: { $ne: "cancelled" },
    };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate([
          { path: "customerId", select: "name email phone avatar" },
          {
            path: "artisanId",
            select: "businessName category hourlyRate rating reviewCount",
            populate: { path: "userId", select: "name email phone avatar" },
          },
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Booking.countDocuments(query),
    ]);

    // Check if each booking has a review
    const bookingsWithReviewStatus = await Promise.all(
      bookings.map(async (booking) => {
        const hasReview = await Review.exists({ bookingId: booking._id });
        return {
          ...booking.toObject(),
          hasReview: !!hasReview,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: bookingsWithReviewStatus,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getArtisanBookings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status, page = 1, limit = 20 } = req.query;

    // Get artisan profile
    const artisan = await Artisan.findOne({ userId });
    if (!artisan) {
      res.status(404).json({
        success: false,
        message: "Artisan profile not found",
      });
      return;
    }

    const query: any = { artisanId: artisan._id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate([
          { path: "customerId", select: "name email phone avatar" },
          {
            path: "artisanId",
            select: "businessName category hourlyRate rating reviewCount",
          },
        ])
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Booking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateBookingStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check authorization (only artisan can update status)
    const artisan = await Artisan.findById(booking.artisanId);
    if (artisan?.userId.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
      return;
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["in-progress", "cancelled"],
      "in-progress": ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      res.status(400).json({
        success: false,
        message: `Cannot transition from ${booking.status} to ${status}`,
      });
      return;
    }

    booking.status = status;

    // If completed, update artisan's completed jobs and release escrow
    if (status === "completed") {
      await Artisan.findByIdAndUpdate(booking.artisanId, {
        $inc: { completedJobs: 1 },
      });
      booking.escrowReleased = true;
    }

    await booking.save();

    // 🔔 NOTIFY CUSTOMER about booking status
    const artisanName =
      (booking.artisanId as any).businessName ||
      (booking.artisanId as any).userId.name;

    if (status === "accepted") {
      await createNotification({
        userId: booking.customerId._id,
        ...NotificationTemplates.bookingAccepted(
          artisanName,
          booking.serviceType,
          booking._id.toString()
        ),
      });
    } else if (status === "canceled") {
      await createNotification({
        userId: booking.customerId._id,
        ...NotificationTemplates.bookingRejected(
          artisanName,
          booking.serviceType,
          booking._id.toString()
        ),
      });
    } else if (status === "completed") {
      await createNotification({
        userId: booking.customerId._id,
        ...NotificationTemplates.bookingCompleted(
          artisanName,
          booking._id.toString()
        ),
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error: any) {
    next(error);
  }
};

export const cancelBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.userId;

    const booking = await Booking.findById(id);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: "Booking not found",
      });
      return;
    }

    // Check authorization
    const artisan = await Artisan.findById(booking.artisanId);
    if (
      booking.customerId.toString() !== userId &&
      artisan?.userId.toString() !== userId &&
      req.user?.role !== "admin"
    ) {
      res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
      return;
    }

    // Can only cancel pending or confirmed bookings
    if (!["pending", "confirmed"].includes(booking.status)) {
      res.status(400).json({
        success: false,
        message: "Cannot cancel booking in current status",
      });
      return;
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason;

    // Refund if payment was made
    if (booking.paymentStatus === "paid" && booking.paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: booking.paymentIntentId,
        });
        booking.paymentStatus = "refunded";
      } catch (stripeError: any) {
        console.error("Stripe refund error:", stripeError);
      }
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (error: any) {
    next(error);
  }
};
