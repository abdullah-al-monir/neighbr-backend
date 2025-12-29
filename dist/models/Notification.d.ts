import mongoose from "mongoose";
export type NotificationType = "contact_inquiry" | "booking_request" | "booking_accepted" | "booking_rejected" | "booking_completed" | "booking_cancelled" | "payment_received" | "payment_confirmed" | "review_received" | "review_reply" | "profile_verified" | "profile_rejected" | "subscription_activated" | "subscription_expiring" | "subscription_expired" | "password_changed" | "password_reset";
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
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, mongoose.DefaultSchemaOptions> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any, INotification>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map