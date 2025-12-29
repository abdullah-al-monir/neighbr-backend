import mongoose from "mongoose";
interface CreateNotificationParams {
    userId: string | mongoose.Types.ObjectId;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}
export declare const createNotification: (params: CreateNotificationParams) => Promise<void>;
export declare const notifyAdmins: (params: Omit<CreateNotificationParams, "userId">) => Promise<void>;
export declare const NotificationTemplates: {
    newContactInquiry: (contactData: any, contactId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            contactId: string;
        };
    };
    newBookingRequest: (customerName: string, serviceType: string, bookingId: string, amount: number) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            bookingId: string;
            amount: number;
        };
    };
    paymentReceived: (customerName: string, amount: number, bookingId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            bookingId: string;
            amount: number;
        };
    };
    newReview: (customerName: string, rating: number, reviewId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            reviewId: string;
            rating: number;
        };
    };
    profileVerified: () => {
        type: string;
        title: string;
        message: string;
        link: string;
    };
    profileRejected: (reason?: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
    };
    bookingAccepted: (artisanName: string, serviceType: string, bookingId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            bookingId: string;
        };
    };
    bookingRejected: (artisanName: string, serviceType: string, bookingId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            bookingId: string;
        };
    };
    bookingCompleted: (artisanName: string, bookingId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            bookingId: string;
        };
    };
    bookingCancelled: (name: string, bookingId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            bookingId: string;
        };
    };
    paymentConfirmed: (amount: number, bookingId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            bookingId: string;
            amount: number;
        };
    };
    reviewReply: (artisanName: string, reviewId: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            reviewId: string;
        };
    };
    subscriptionActivated: (tier: string, duration: number, newFeePercentage: number) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            tier: string;
            duration: number;
            newFeePercentage: number;
        };
    };
    subscriptionExpiring: (tier: string, daysLeft: number) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            tier: string;
            daysLeft: number;
        };
    };
    subscriptionExpired: (tier: string) => {
        type: string;
        title: string;
        message: string;
        link: string;
        metadata: {
            tier: string;
        };
    };
    passwordChanged: () => {
        type: string;
        title: string;
        message: string;
        link: string;
    };
    passwordResetRequested: () => {
        type: string;
        title: string;
        message: string;
        link: string;
    };
};
export {};
//# sourceMappingURL=notificationService.d.ts.map