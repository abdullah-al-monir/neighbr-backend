import Notification from "../models/Notification";
import User from "../models/User";
import mongoose from "mongoose";

interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

export const createNotification = async (params: CreateNotificationParams) => {
  try {
    await Notification.create(params);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

// Create notifications for all admins
export const notifyAdmins = async (
  params: Omit<CreateNotificationParams, "userId">
) => {
  try {
    const admins = await User.find({ role: "admin" }, "_id");
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      ...params,
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error("Failed to notify admins:", error);
  }
};

// Notification Templates
export const NotificationTemplates = {
  // Admin notifications
  newContactInquiry: (contactData: any, contactId: string) => ({
    type: "contact_inquiry",
    title: "🔔 New Customer Inquiry",
    message: `${contactData.firstName} ${contactData.lastName} sent an inquiry: "${contactData.subject}"`,
    link: `/admin/inquiries`,
    metadata: { contactId },
  }),

  // Artisan notifications
  newBookingRequest: (
    customerName: string,
    serviceType: string,
    bookingId: string,
    amount: number
  ) => ({
    type: "booking_request",
    title: "📅 New Booking Request",
    message: `${customerName} requested ${serviceType} service for $${amount}`,
    link: `/artisan/orders`,
    metadata: { bookingId, amount },
  }),

  paymentReceived: (
    customerName: string,
    amount: number,
    bookingId: string
  ) => ({
    type: "payment_received",
    title: "💰 Payment Received",
    message: `You received $${amount} from ${customerName}`,
    link: `/artisan/orders`,
    metadata: { bookingId, amount },
  }),

  newReview: (customerName: string, rating: number, reviewId: string) => ({
    type: "review_received",
    title: "⭐ New Review",
    message: `${customerName} left you a ${rating}-star review`,
    link: `/artisan/reviews`,
    metadata: { reviewId, rating },
  }),

  profileVerified: () => ({
    type: "profile_verified",
    title: "✅ Profile Verified",
    message: "Congratulations! Your artisan profile has been verified",
    link: "/artisan/dashboard",
  }),

  profileRejected: (reason?: string) => ({
    type: "profile_rejected",
    title: "❌ Profile Verification Failed",
    message:
      reason ||
      "Your profile verification was rejected. Please update your information.",
    link: "/artisan/profile",
  }),

  // Customer notifications
  bookingAccepted: (
    artisanName: string,
    serviceType: string,
    bookingId: string
  ) => ({
    type: "booking_accepted",
    title: "✅ Booking Accepted",
    message: `${artisanName} accepted your ${serviceType} booking`,
    link: `/booking/${bookingId}`,
    metadata: { bookingId },
  }),

  bookingRejected: (
    artisanName: string,
    serviceType: string,
    bookingId: string
  ) => ({
    type: "booking_rejected",
    title: "❌ Booking Declined",
    message: `${artisanName} declined your ${serviceType} booking`,
    link: `/booking/${bookingId}`,
    metadata: { bookingId },
  }),

  bookingCompleted: (artisanName: string, bookingId: string) => ({
    type: "booking_completed",
    title: "✨ Service Completed",
    message: `${artisanName} marked your booking as completed. Please leave a review!`,
    link: `/booking/${bookingId}`,
    metadata: { bookingId },
  }),

  bookingCancelled: (name: string, bookingId: string) => ({
    type: "booking_cancelled",
    title: "🚫 Booking Cancelled",
    message: `${name} cancelled the booking`,
    link: `/booking/${bookingId}`,
    metadata: { bookingId },
  }),

  paymentConfirmed: (amount: number, bookingId: string) => ({
    type: "payment_confirmed",
    title: "💳 Payment Confirmed",
    message: `Your payment of $${amount} has been confirmed`,
    link: `/booking/${bookingId}`,
    metadata: { bookingId, amount },
  }),

  reviewReply: (artisanName: string, reviewId: string) => ({
    type: "review_reply",
    title: "💬 Review Reply",
    message: `${artisanName} replied to your review`,
    link: `/my-reviews`,
    metadata: { reviewId },
  }),

  subscriptionActivated: (
    tier: string,
    duration: number,
    newFeePercentage: number
  ) => ({
    type: "subscription_activated",
    title: "🎉 Subscription Activated",
    message: `Your ${tier} subscription is now active for ${duration} days! Platform fee reduced to ${newFeePercentage}%`,
    link: "/artisan/dashboard",
    metadata: { tier, duration, newFeePercentage },
  }),

  subscriptionExpiring: (tier: string, daysLeft: number) => ({
    type: "subscription_expiring",
    title: "⏰ Subscription Expiring Soon",
    message: `Your ${tier} subscription will expire in ${daysLeft} days. Renew now to keep your benefits!`,
    link: "/artisan/subscription",
    metadata: { tier, daysLeft },
  }),

  subscriptionExpired: (tier: string) => ({
    type: "subscription_expired",
    title: "❌ Subscription Expired",
    message: `Your ${tier} subscription has expired. Renew to continue enjoying premium benefits.`,
    link: "/artisan/subscription",
    metadata: { tier },
  }),

  passwordChanged: () => ({
    type: "password_changed",
    title: "🔒 Password Changed",
    message:
      "Your password was successfully changed. If this wasn't you, contact support immediately.",
    link: "/profile",
  }),

  passwordResetRequested: () => ({
    type: "password_reset",
    title: "🔑 Password Reset Requested",
    message:
      "A password reset was requested for your account. Check your email for the reset link.",
    link: "/profile",
  }),
};
