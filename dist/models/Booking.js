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
const BookingSchema = new mongoose_1.Schema({
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Customer ID is required"],
        index: true,
    },
    artisanId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Artisan",
        required: [true, "Artisan ID is required"],
        index: true,
    },
    serviceType: {
        type: String,
        required: [true, "Service type is required"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        minlength: [10, "Description must be at least 10 characters"],
        maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    scheduledDate: {
        type: Date,
        required: [true, "Scheduled date is required"],
        validate: {
            validator: function (v) {
                return v > new Date();
            },
            message: "Scheduled date must be in the future",
        },
    },
    timeSlot: {
        start: {
            type: String,
            required: [true, "Start time is required"],
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
        end: {
            type: String,
            required: [true, "End time is required"],
            match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        },
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "in-progress", "completed", "cancelled"],
        default: "pending",
        index: true,
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [5, "Amount must be at least $5"],
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded", "failed"],
        default: "pending",
        index: true,
    },
    paymentIntentId: {
        type: String,
        sparse: true,
    },
    escrowReleased: {
        type: Boolean,
        default: false,
    },
    cancellationReason: {
        type: String,
        maxlength: [500, "Cancellation reason cannot exceed 500 characters"],
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            required: [true, "Coordinates are required"],
        },
        address: {
            type: String,
            required: [true, "Address is required"],
        },
    },
    notes: {
        type: String,
        maxlength: [500, "Notes cannot exceed 500 characters"],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound indexes for queries
BookingSchema.index({ customerId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ artisanId: 1, status: 1, scheduledDate: 1 });
BookingSchema.index({ status: 1, scheduledDate: 1 });
// Geospatial index
BookingSchema.index({ "location.coordinates": "2dsphere" });
// Virtual for customer details
BookingSchema.virtual("customer", {
    ref: "User",
    localField: "customerId",
    foreignField: "_id",
    justOne: true,
});
// Virtual for artisan details
BookingSchema.virtual("artisan", {
    ref: "Artisan",
    localField: "artisanId",
    foreignField: "_id",
    justOne: true,
});
// Pre-save hook to validate time slot
BookingSchema.pre("save", async function () {
    const start = this.timeSlot.start.split(":").map(Number);
    const end = this.timeSlot.end.split(":").map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    if (startMinutes >= endMinutes) {
        throw new Error("End time must be after start time");
    }
});
exports.default = mongoose_1.default.model("Booking", BookingSchema);
//# sourceMappingURL=Booking.js.map