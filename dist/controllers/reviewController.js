"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addArtisanResponse = exports.deleteReview = exports.updateReview = exports.getReview = exports.getArtisanReviews = exports.createReview = void 0;
const Review_1 = __importDefault(require("../models/Review"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Artisan_1 = __importDefault(require("../models/Artisan"));
const createReview = async (req, res, next) => {
    try {
        const customerId = req.user?.userId;
        const { bookingId, rating, comment, images } = req.body;
        // Check if booking exists and is completed
        const booking = await Booking_1.default.findById(bookingId);
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }
        if (booking.customerId.toString() !== customerId) {
            res.status(403).json({
                success: false,
                message: "Not authorized to review this booking",
            });
            return;
        }
        if (booking.status !== "completed") {
            res.status(400).json({
                success: false,
                message: "Can only review completed bookings",
            });
            return;
        }
        // Check if review already exists
        const existingReview = await Review_1.default.findOne({ bookingId });
        if (existingReview) {
            res.status(400).json({
                success: false,
                message: "Review already exists for this booking",
            });
            return;
        }
        // Create review
        const review = await Review_1.default.create({
            bookingId,
            customerId,
            artisanId: booking.artisanId,
            rating,
            comment,
            images: images || [],
        });
        await review.populate([
            { path: "customerId", select: "name avatar" },
            { path: "bookingId", select: "serviceType scheduledDate" },
        ]);
        res.status(201).json({
            success: true,
            message: "Review created successfully",
            review,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createReview = createReview;
const getArtisanReviews = async (req, res, next) => {
    try {
        const { id: artisanId } = req.params;
        const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        let sort = { createdAt: -1 };
        if (sortBy === "rating") {
            sort = { rating: -1, createdAt: -1 };
        }
        const [reviews, total, stats] = await Promise.all([
            Review_1.default.find({ artisanId })
                .populate("customerId", "name avatar")
                .populate("bookingId", "serviceType scheduledDate")
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            Review_1.default.countDocuments({ artisanId }),
            Review_1.default.aggregate([
                { $match: { artisanId: artisanId } },
                {
                    $group: {
                        _id: "$rating",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);
        // Calculate rating distribution
        const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
            const stat = stats.find((s) => s._id === rating);
            return {
                rating,
                count: stat ? stat.count : 0,
                percentage: total > 0 ? ((stat?.count || 0) / total) * 100 : 0,
            };
        });
        res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
            stats: {
                total,
                ratingDistribution,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getArtisanReviews = getArtisanReviews;
const getReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const review = await Review_1.default.findById(id).populate([
            { path: "customerId", select: "name avatar" },
            { path: "bookingId", select: "serviceType scheduledDate" },
        ]);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            review,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReview = getReview;
const updateReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const { rating, comment, images } = req.body;
        const review = await Review_1.default.findById(id);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        if (review.customerId.toString() !== userId) {
            res.status(403).json({
                success: false,
                message: "Not authorized to update this review",
            });
            return;
        }
        // Update review
        if (rating)
            review.rating = rating;
        if (comment)
            review.comment = comment;
        if (images)
            review.images = images;
        await review.save();
        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            review,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateReview = updateReview;
const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const review = await Review_1.default.findById(id);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        if (review.customerId.toString() !== userId && req.user?.role !== "admin") {
            res.status(403).json({
                success: false,
                message: "Not authorized to delete this review",
            });
            return;
        }
        await Review_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteReview = deleteReview;
const addArtisanResponse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const { text } = req.body;
        const review = await Review_1.default.findById(id);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found",
            });
            return;
        }
        // Check if user is the artisan
        const artisan = await Artisan_1.default.findById(review.artisanId);
        if (artisan?.userId.toString() !== userId && req.user?.role !== "admin") {
            res.status(403).json({
                success: false,
                message: "Not authorized to respond to this review",
            });
            return;
        }
        review.response = {
            text,
            createdAt: new Date(),
        };
        await review.save();
        res.status(200).json({
            success: true,
            message: "Response added successfully",
            review,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.addArtisanResponse = addArtisanResponse;
//# sourceMappingURL=reviewController.js.map