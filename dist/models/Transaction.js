"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TransactionSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Booking",
        sparse: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
        index: true,
    },
    type: {
        type: String,
        enum: ["booking", "subscription", "refund"],
        required: [true, "Transaction type is required"],
        index: true,
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"],
    },
    platformFee: {
        type: Number,
        required: [true, "Platform fee is required"],
        min: [0, "Platform fee cannot be negative"],
        default: 0,
    },
    netAmount: {
        type: Number,
        required: [true, "Net amount is required"],
        min: [0, "Net amount cannot be negative"],
    },
    stripePaymentIntentId: {
        type: String,
        required: [true, "Stripe payment intent ID is required"],
        unique: true,
        index: true,
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
        index: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound indexes for queries
TransactionSchema.index({ userId: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
// Virtual for user details
TransactionSchema.virtual("user", {
    ref: "User",
    localField: "userId",
    foreignField: "_id",
    justOne: true,
});
// Virtual for booking details
TransactionSchema.virtual("booking", {
    ref: "Booking",
    localField: "bookingId",
    foreignField: "_id",
    justOne: true,
});
// Pre-save hook to calculate net amount
TransactionSchema.pre("save", async function () {
    if (this.isModified("amount") || this.isModified("platformFee")) {
        this.netAmount = this.amount - this.platformFee;
    }
    if (this.netAmount < 0) {
        throw new Error("Net amount cannot be negative");
    }
});
exports.default = mongoose_1.default.model("Transaction", TransactionSchema);
//# sourceMappingURL=Transaction.js.map