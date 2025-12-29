"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContactForm = exports.getAboutPageData = exports.getHomePageData = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const Review_1 = __importDefault(require("../models/Review"));
const Booking_1 = __importDefault(require("../models/Booking"));
const City_1 = __importDefault(require("../models/City"));
const User_1 = __importDefault(require("../models/User"));
const PlatformFeeConfig_1 = __importDefault(require("../models/PlatformFeeConfig"));
const SubscriptionSettings_1 = __importDefault(require("../models/SubscriptionSettings"));
const ContactMessage_1 = __importDefault(require("../models/ContactMessage"));
const emailService_1 = require("../services/emailService");
const Notification_1 = __importDefault(require("../models/Notification"));
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
        const contactMessage = await ContactMessage_1.default.create({
            firstName,
            lastName,
            email,
            subject,
            message,
        });
        // Send confirmation email to user
        try {
            await (0, emailService_1.sendContactConfirmation)(email, firstName, subject);
        }
        catch (emailError) {
            console.error("Failed to send confirmation email:", emailError);
        }
        // CREATE NOTIFICATION FOR ALL ADMINS (instead of email)
        try {
            const admins = await User_1.default.find({ role: "admin" });
            const notifications = admins.map((admin) => ({
                userId: admin._id,
                type: "contact_inquiry",
                title: "New Customer Inquiry",
                message: `${firstName} ${lastName} sent an inquiry: "${subject}"`,
                link: `/admin/support-requests/${contactMessage._id}`,
            }));
            await Notification_1.default.insertMany(notifications);
        }
        catch (notificationError) {
            console.error("Failed to create notification:", notificationError);
        }
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
//# sourceMappingURL=publicController.js.map