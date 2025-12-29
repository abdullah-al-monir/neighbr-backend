import mongoose from "mongoose";

export type NotificationType =
  | "contact_inquiry" // Admin: New contact message
  | "booking_request" // Artisan: New booking request
  | "booking_accepted" // Customer: Booking accepted
  | "booking_rejected" // Customer: Booking rejected
  | "booking_completed" // Both: Booking completed
  | "booking_cancelled" // Both: Booking cancelled
  | "payment_received" // Artisan: Payment received
  | "payment_confirmed" // Customer: Payment confirmed
  | "review_received" // Artisan: New review
  | "review_reply" // Customer: Artisan replied to review
  | "profile_verified" // Artisan: Profile verified by admin
  | "profile_rejected"
  | "subscription_activated"
  | "subscription_expiring"
  | "subscription_expired"
  | "password_changed"
  | "password_reset";

interface INotification extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: {
    bookingId?: string;
    artisanId?: string;
    customerId?: string;
    contactId?: string;
    reviewId?: string;
    amount?: number;
  };
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "contact_inquiry",
        "booking_request",
        "booking_accepted",
        "booking_rejected",
        "booking_completed",
        "booking_cancelled",
        "payment_received",
        "payment_confirmed",
        "review_received",
        "review_reply",
        "profile_verified",
        "profile_rejected",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      bookingId: String,
      artisanId: String,
      customerId: String,
      contactId: String,
      reviewId: String,
      amount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
