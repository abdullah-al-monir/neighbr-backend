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
const PortfolioSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        validate: {
            validator: function (v) {
                return v.length > 0 && v.length <= 10;
            },
            message: 'Portfolio must have 1-10 images',
        },
    },
    category: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const AvailabilitySchema = new mongoose_1.Schema({
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6,
    },
    slots: [
        {
            start: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            },
            end: {
                type: String,
                required: true,
                match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
            },
            booked: {
                type: Boolean,
                default: false,
            },
        },
    ],
});
const ArtisanSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        minlength: [2, 'Business name must be at least 2 characters'],
        maxlength: [100, 'Business name cannot exceed 100 characters'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: [
            'baker',
            'tailor',
            'carpenter',
            'electrician',
            'plumber',
            'painter',
            'mechanic',
            'gardener',
            'cleaner',
            'other',
        ],
    },
    skills: {
        type: [String],
        required: [true, 'At least one skill is required'],
        validate: {
            validator: function (v) {
                return v.length > 0 && v.length <= 20;
            },
            message: 'Must have 1-20 skills',
        },
    },
    bio: {
        type: String,
        required: [true, 'Bio is required'],
        minlength: [50, 'Bio must be at least 50 characters'],
        maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    portfolio: {
        type: [PortfolioSchema],
        default: [],
        validate: {
            validator: function (v) {
                return v.length <= 50;
            },
            message: 'Cannot have more than 50 portfolio items',
        },
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviewCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    completedJobs: {
        type: Number,
        default: 0,
        min: 0,
    },
    availability: {
        type: [AvailabilitySchema],
        default: [],
    },
    hourlyRate: {
        type: Number,
        required: [true, 'Hourly rate is required'],
        min: [5, 'Hourly rate must be at least $5'],
        max: [1000, 'Hourly rate cannot exceed $1000'],
    },
    subscriptionTier: {
        type: String,
        enum: ['free', 'basic', 'premium'],
        default: 'free',
    },
    subscriptionExpiresAt: {
        type: Date,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    verificationDocuments: {
        type: [String],
        default: [],
    },
    location: {
        division: {
            type: String,
            required: [true, 'Division is required'],
            enum: ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'],
        },
        district: {
            type: String,
            required: [true, 'District is required'],
            trim: true,
        },
        area: {
            type: String,
            required: [true, 'Area is required'],
            trim: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
        },
        cityId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'City',
            required: [true, 'City is required'],
        },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Index for location-based queries
ArtisanSchema.index({ 'location.division': 1, 'location.district': 1, 'location.area': 1 });
ArtisanSchema.index({ 'location.cityId': 1 });
// Index for category and rating
ArtisanSchema.index({ category: 1, rating: -1 });
// Index for verified artisans
ArtisanSchema.index({ verified: 1 });
// Compound index for search
ArtisanSchema.index({ category: 1, verified: 1, rating: -1 });
// Virtual for user details
ArtisanSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
});
// Virtual for city details
ArtisanSchema.virtual('city', {
    ref: 'City',
    localField: 'location.cityId',
    foreignField: '_id',
    justOne: true,
});
exports.default = mongoose_1.default.model('Artisan', ArtisanSchema);
//# sourceMappingURL=Artisan.js.map