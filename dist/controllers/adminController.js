"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryStats = exports.deleteUser = exports.getAllTransactions = exports.getTransactionById = exports.getBookingById = exports.getAllBookings = exports.deleteArtisan = exports.updateArtisanVerification = exports.getAllArtisans = exports.updateUserVerification = exports.getAllUsers = exports.getUserById = exports.getRevenueAnalytics = exports.getDashboardStats = void 0;
const User_1 = __importDefault(require("../models/User"));
const Artisan_1 = __importDefault(require("../models/Artisan"));
const Booking_1 = __importDefault(require("../models/Booking"));
const Transaction_1 = __importDefault(require("../models/Transaction"));
// import Review from "../models/Review";
const getDashboardStats = async (
// @ts-ignore
req, res, next) => {
    try {
        const [totalUsers, totalArtisans, totalBookings, activeBookings, pendingVerifications, revenueData,] = await Promise.all([
            User_1.default.countDocuments(),
            Artisan_1.default.countDocuments(),
            Booking_1.default.countDocuments(),
            Booking_1.default.countDocuments({
                status: { $in: ["pending", "confirmed", "in-progress"] },
            }),
            Artisan_1.default.countDocuments({ verified: false }),
            Transaction_1.default.aggregate([
                { $match: { status: "completed", type: "booking" } },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$amount" },
                        platformRevenue: { $sum: "$platformFee" },
                    },
                },
            ]),
        ]);
        // Calculate growth rates (compared to last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [usersLastMonth, revenueLastMonth] = await Promise.all([
            User_1.default.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Transaction_1.default.aggregate([
                {
                    $match: {
                        status: "completed",
                        type: "booking",
                        createdAt: { $gte: thirtyDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: null,
                        revenue: { $sum: "$amount" },
                    },
                },
            ]),
        ]);
        const totalRevenue = revenueData[0]?.totalRevenue || 0;
        const platformRevenue = revenueData[0]?.platformRevenue || 0;
        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalArtisans,
                totalBookings,
                totalRevenue,
                platformRevenue,
                activeBookings,
                pendingVerifications,
                userGrowth: usersLastMonth,
                revenueGrowth: revenueLastMonth[0]?.revenue || 0,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardStats = getDashboardStats;
const getRevenueAnalytics = async (req, res, next) => {
    try {
        const { period = "30" } = req.query;
        const days = parseInt(period);
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const revenueData = await Transaction_1.default.aggregate([
            {
                $match: {
                    status: "completed",
                    type: "booking",
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    revenue: { $sum: "$amount" },
                    platformFee: { $sum: "$platformFee" },
                    bookings: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.status(200).json({
            success: true,
            data: revenueData.map((item) => ({
                date: item._id,
                revenue: item.revenue,
                platformFee: item.platformFee,
                bookings: item.bookings,
            })),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getRevenueAnalytics = getRevenueAnalytics;
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User_1.default.findById(id).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserById = getUserById;
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, role, search, verified } = req.query;
        const query = {};
        // Filter by role
        if (role) {
            query.role = role;
        }
        // Filter by verified status
        if (verified !== undefined && verified !== "all") {
            query.verified = verified === "true";
        }
        // Search by name or email
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            User_1.default.find(query)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllUsers = getAllUsers;
const updateUserVerification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { verified } = req.body;
        // Validate input
        if (typeof verified !== "boolean") {
            res.status(400).json({
                success: false,
                message: "Verified must be a boolean value",
            });
            return;
        }
        // Find and update user
        const user = await User_1.default.findByIdAndUpdate(id, { verified }, { new: true, runValidators: true }).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
            message: `User ${verified ? "verified" : "unverified"} successfully`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateUserVerification = updateUserVerification;
const getAllArtisans = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, verified, category, search } = req.query;
        const query = {};
        // Filter by verified status
        if (verified !== undefined && verified !== "all") {
            query.verified = verified === "true";
        }
        // Filter by category
        if (category) {
            query.category = category;
        }
        // Search by business name
        if (search) {
            query.businessName = { $regex: search, $options: "i" };
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [artisans, total] = await Promise.all([
            Artisan_1.default.find(query)
                .populate("userId", "name email phone verified")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Artisan_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: artisans,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllArtisans = getAllArtisans;
const updateArtisanVerification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { verified } = req.body;
        // Validate input
        if (typeof verified !== "boolean") {
            res.status(400).json({
                success: false,
                message: "Verified must be a boolean value",
            });
            return;
        }
        // Find and update artisan
        const artisan = await Artisan_1.default.findByIdAndUpdate(id, { verified }, { new: true, runValidators: true }).populate("userId", "name email");
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: artisan,
            message: `Artisan ${verified ? "verified" : "unverified"} successfully`,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateArtisanVerification = updateArtisanVerification;
const deleteArtisan = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Find and delete artisan
        const artisan = await Artisan_1.default.findByIdAndDelete(id);
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Artisan deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteArtisan = deleteArtisan;
const getAllBookings = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (search) {
            query.$or = [
                { serviceType: { $regex: search, $options: "i" } },
                { specialRequests: { $regex: search, $options: "i" } },
            ];
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [bookings, total] = await Promise.all([
            Booking_1.default.find(query)
                .populate("customer", "name email phone avatar")
                .populate("artisan", "businessName category hourlyRate rating reviewCount")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Booking_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: bookings,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllBookings = getAllBookings;
const getBookingById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await Booking_1.default.findById(id).populate([
            { path: "customerId", select: "name email phone avatar" },
            {
                path: "artisanId",
                select: "businessName category hourlyRate rating reviewCount",
                populate: { path: "userId", select: "name email phone avatar" },
            },
        ]);
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBookingById = getBookingById;
const getTransactionById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction_1.default.findById(id).populate("userId", "name email");
        if (!transaction) {
            res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: transaction,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTransactionById = getTransactionById;
const getAllTransactions = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, type } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (type)
            query.type = type;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [transactions, total] = await Promise.all([
            Transaction_1.default.find(query)
                .populate("userId", "name email")
                .populate("bookingId", "serviceType scheduledDate")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            Transaction_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllTransactions = getAllTransactions;
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User_1.default.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        // Delete associated artisan profile if exists
        await Artisan_1.default.findOneAndDelete({ userId: id });
        // Delete user
        await User_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteUser = deleteUser;
const getCategoryStats = async (
// @ts-ignore
req, res, next) => {
    try {
        const categoryStats = await Artisan_1.default.aggregate([
            { $match: { verified: true } },
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 },
                    avgRating: { $avg: "$rating" },
                    totalJobs: { $sum: "$completedJobs" },
                },
            },
            { $sort: { count: -1 } },
        ]);
        res.status(200).json({
            success: true,
            data: categoryStats,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCategoryStats = getCategoryStats;
//# sourceMappingURL=adminController.js.map