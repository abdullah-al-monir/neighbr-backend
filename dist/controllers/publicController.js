"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactMessage = exports.updateContactMessageStatus = exports.getContactMessages = exports.submitContactForm = exports.getAboutPageData = exports.getHomePageData = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const Review_1 = __importDefault(require("../models/Review"));
const Booking_1 = __importDefault(require("../models/Booking"));
const City_1 = __importDefault(require("../models/City"));
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
const PlatformFeeConfig_1 = __importDefault(require("../models/PlatformFeeConfig"));
const SubscriptionSettings_1 = __importDefault(require("../models/SubscriptionSettings"));
const getHomePageData = async (_req, res, next) => {
    try {
        const [totalArtisans, verifiedArtisans, totalBookings, completedBookings, totalReviews, totalCustomers, activeCities,] = await Promise.all([
            Artisan_1.default.countDocuments(),
            Artisan_1.default.countDocuments({ verified: true }),
            Booking_1.default.countDocuments(),
            Booking_1.default.countDocuments({ status: "completed" }),
            Review_1.default.countDocuments(),
            User_1.default.countDocuments({ role: "customer" }),
            City_1.default.countDocuments({ isActive: true }),
        ]);
        // Get category statistics
        const categoryStats = await Artisan_1.default.aggregate([
            { $match: { verified: true } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);
        // Get top-rated artisans (Featured)
        const featuredArtisans = await Artisan_1.default.find({ verified: true })
            .sort({ rating: -1, reviewCount: -1 })
            .limit(6)
            .populate("userId", "name email")
            .populate("location.cityId", "name division district area")
            .select("businessName category rating reviewCount completedJobs location hourlyRate portfolio");
        // Get recent reviews (Testimonials)
        const recentReviews = await Review_1.default.find()
            .sort({ createdAt: -1 })
            .limit(6)
            .populate("customerId", "name")
            .populate("artisanId", "businessName category")
            .select("rating comment createdAt customerId artisanId");
        // Get coverage areas (divisions with city count)
        const coverageAreas = await City_1.default.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: "$division",
                    cityCount: { $sum: 1 },
                    districts: { $addToSet: "$district" },
                },
            },
            {
                $project: {
                    division: "$_id",
                    cityCount: 1,
                    districtCount: { $size: "$districts" },
                },
            },
            { $sort: { cityCount: -1 } },
        ]);
        const avgRatingResult = await Review_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                },
            },
        ]);
        const platformAvgRating = avgRatingResult.length > 0
            ? Math.round(avgRatingResult[0].avgRating * 10) / 10
            : 0;
        res.status(200).json({
            success: true,
            data: {
                statistics: {
                    totalArtisans,
                    verifiedArtisans,
                    totalBookings,
                    completedBookings,
                    totalReviews,
                    totalCustomers,
                    activeCities,
                    platformAvgRating,
                },
                categories: categoryStats.map((cat) => ({
                    name: cat._id,
                    count: cat.count,
                })),
                featuredArtisans,
                testimonials: recentReviews,
                coverageAreas,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getHomePageData = getHomePageData;
const getAboutPageData = async (_req, res, next) => {
    try {
        const [totalArtisans, verifiedArtisans, totalCustomers, completedBookings, totalReviews,] = await Promise.all([
            Artisan_1.default.countDocuments(),
            Artisan_1.default.countDocuments({ verified: true }),
            User_1.default.countDocuments({ role: "customer" }),
            Booking_1.default.countDocuments({ status: "completed" }),
            Review_1.default.countDocuments(),
        ]);
        // Calculate average rating
        const avgRatingResult = await Review_1.default.aggregate([
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" },
                },
            },
        ]);
        const platformAvgRating = avgRatingResult.length > 0
            ? Math.round(avgRatingResult[0].avgRating * 10) / 10
            : 0;
        const divisionStats = await Artisan_1.default.aggregate([
            { $match: { verified: true } },
            {
                $group: {
                    _id: "$location.division",
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);
        const subscriptionPlans = await SubscriptionSettings_1.default.find({
            isActive: true,
        })
            .select("tier name price duration features maxPortfolioItems prioritySupport featuredListing analyticsAccess description")
            .sort({ price: 1 });
        const platformFees = await PlatformFeeConfig_1.default.find({ isActive: true })
            .select("tier feePercentage description")
            .sort({ feePercentage: 1 });
        const plansWithFees = subscriptionPlans.map((plan) => {
            const feeConfig = platformFees.find((f) => f.tier === plan.tier);
            return {
                ...plan.toObject(),
                commissionRate: feeConfig ? feeConfig.feePercentage : null,
                commissionDescription: feeConfig?.description || "",
            };
        });
        res.status(200).json({
            success: true,
            data: {
                statistics: {
                    totalArtisans,
                    verifiedArtisans,
                    totalCustomers,
                    completedBookings,
                    platformAvgRating,
                    totalReviews,
                },
                divisionStats,
                subscriptionPlans: plansWithFees,
                platformFees,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAboutPageData = getAboutPageData;
const ContactMessageSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address",
        ],
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true,
        minlength: [5, "Subject must be at least 5 characters"],
        maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
        minlength: [10, "Message must be at least 10 characters"],
        maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    status: {
        type: String,
        enum: ["new", "in-progress", "resolved"],
        default: "new",
    },
}, {
    timestamps: true,
});
// Index for admin queries
ContactMessageSchema.index({ status: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1 });
const ContactMessage = mongoose_1.default.model("ContactMessage", ContactMessageSchema);
exports.ContactMessage = ContactMessage;
// Submit contact form
const submitContactForm = async (req, res, next) => {
    try {
        const { firstName, lastName, email, subject, message } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            res.status(400).json({
                success: false,
                message: "All fields are required",
            });
            return;
        }
        // Create contact message
        const contactMessage = await ContactMessage.create({
            firstName,
            lastName,
            email,
            subject,
            message,
        });
        // TODO: Send email notification to admin
        // TODO: Send confirmation email to user
        res.status(201).json({
            success: true,
            message: "Your message has been sent successfully. We will get back to you within 24 hours.",
            data: {
                id: contactMessage._id,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.submitContactForm = submitContactForm;
// Get all contact messages (admin only)
const getContactMessages = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [messages, total] = await Promise.all([
            ContactMessage.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ContactMessage.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getContactMessages = getContactMessages;
// Update contact message status (admin only)
const updateContactMessageStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!["new", "in-progress", "resolved"].includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid status",
            });
            return;
        }
        const message = await ContactMessage.findByIdAndUpdate(id, { status }, { new: true });
        if (!message) {
            res.status(404).json({
                success: false,
                message: "Contact message not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: message,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateContactMessageStatus = updateContactMessageStatus;
//# sourceMappingURL=publicController.js.map