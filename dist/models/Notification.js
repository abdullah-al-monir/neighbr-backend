"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const NotificationSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Compound index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
exports.default = mongoose_1.default.model("Notification", NotificationSchema);
//# sourceMappingURL=Notification.js.map