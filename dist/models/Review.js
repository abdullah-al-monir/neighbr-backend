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
const ReviewSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        required: [true, 'Booking ID is required'],
        unique: true, // One review per booking
        index: true,
    },
    customerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Customer ID is required'],
        index: true,
    },
    artisanId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Artisan',
        required: [true, 'Artisan ID is required'],
        index: true,
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        minlength: [10, 'Comment must be at least 10 characters'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        trim: true,
    },
    images: {
        type: [String],
        validate: {
            validator: function (v) {
                return !v || v.length <= 5;
            },
            message: 'Cannot upload more than 5 images',
        },
    },
    response: {
        text: {
            type: String,
            maxlength: [500, 'Response cannot exceed 500 characters'],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Compound index for artisan reviews
ReviewSchema.index({ artisanId: 1, rating: -1, createdAt: -1 });
// Index for customer reviews
ReviewSchema.index({ customerId: 1, createdAt: -1 });
// Virtual for customer details
ReviewSchema.virtual('customer', {
    ref: 'User',
    localField: 'customerId',
    foreignField: '_id',
    justOne: true,
});
// Virtual for booking details
ReviewSchema.virtual('booking', {
    ref: 'Booking',
    localField: 'bookingId',
    foreignField: '_id',
    justOne: true,
});
// Post-save hook to update artisan rating
ReviewSchema.post('save', async function () {
    const Artisan = mongoose_1.default.model('Artisan');
    const stats = await mongoose_1.default.model('Review').aggregate([
        { $match: { artisanId: this.artisanId } },
        {
            $group: {
                _id: '$artisanId',
                avgRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 },
            },
        },
    ]);
    if (stats.length > 0) {
        await Artisan.findByIdAndUpdate(this.artisanId, {
            rating: Math.round(stats[0].avgRating * 10) / 10, // Round to 1 decimal
            reviewCount: stats[0].reviewCount,
        });
    }
});
// Post-remove hook to update artisan rating
ReviewSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        const Artisan = mongoose_1.default.model('Artisan');
        const stats = await mongoose_1.default.model('Review').aggregate([
            { $match: { artisanId: doc.artisanId } },
            {
                $group: {
                    _id: '$artisanId',
                    avgRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 },
                },
            },
        ]);
        if (stats.length > 0) {
            await Artisan.findByIdAndUpdate(doc.artisanId, {
                rating: Math.round(stats[0].avgRating * 10) / 10,
                reviewCount: stats[0].reviewCount,
            });
        }
        else {
            await Artisan.findByIdAndUpdate(doc.artisanId, {
                rating: 0,
                reviewCount: 0,
            });
        }
    }
});
exports.default = mongoose_1.default.model('Review', ReviewSchema);
//# sourceMappingURL=Review.js.map