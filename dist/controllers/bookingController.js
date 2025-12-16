"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelBooking = exports.updateBookingStatus = exports.getArtisanBookings = exports.getMyBookings = exports.getBooking = exports.createBooking = void 0;
const Booking_1 = __importDefault(require("../models/Booking"));
const Artisan_1 = __importDefault(require("../models/Artisan"));
const stripe_1 = require("../config/stripe");
const createBooking = async (req, res, next) => {
    try {
        const customerId = req.user?.userId;
        const { artisanId, serviceType, description, scheduledDate, timeSlot, location, notes, } = req.body;
        // Get artisan details
        const artisan = await Artisan_1.default.findById(artisanId);
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan not found",
            });
            return;
        }
        if (!artisan.verified) {
            res.status(400).json({
                success: false,
                message: "Artisan is not verified",
            });
            return;
        }
        // Calculate booking duration and amount
        const startTime = timeSlot.start.split(":");
        const endTime = timeSlot.end.split(":");
        const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
        const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
        const durationHours = (endMinutes - startMinutes) / 60;
        const amount = durationHours * artisan.hourlyRate;
        // Create booking
        const booking = await Booking_1.default.create({
            customerId,
            artisanId,
            serviceType,
            description,
            scheduledDate,
            timeSlot,
            amount,
            location,
            notes,
            status: "pending",
            paymentStatus: "pending",
        });
        await booking.populate([
            { path: "customerId", select: "name email phone avatar" },
            {
                path: "artisanId",
                select: "businessName category hourlyRate rating reviewCount",
                populate: { path: "userId", select: "name email phone avatar" },
            },
        ]);
        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createBooking = createBooking;
const getBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
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
        // Check authorization
        const artisan = await Artisan_1.default.findById(booking.artisanId);
        if (booking.customerId._id.toString() !== userId &&
            artisan?.userId.toString() !== userId &&
            req.user?.role !== "admin") {
            res.status(403).json({
                success: false,
                message: "Not authorized to access this booking",
            });
            return;
        }
        res.status(200).json({
            success: true,
            booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getBooking = getBooking;
const getMyBookings = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        console.log(userId);
        const { status, page = 1, limit = 20 } = req.query;
        const query = {
            customerId: userId,
            status: { $ne: "cancelled" },
        };
        if (status) {
            query.status = status;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [bookings, total] = await Promise.all([
            Booking_1.default.find(query)
                .populate([
                { path: "customerId", select: "name email phone avatar" },
                {
                    path: "artisanId",
                    select: "businessName category hourlyRate rating reviewCount",
                    populate: { path: "userId", select: "name email phone avatar" },
                },
            ])
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
exports.getMyBookings = getMyBookings;
const getArtisanBookings = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { status, page = 1, limit = 20 } = req.query;
        // Get artisan profile
        const artisan = await Artisan_1.default.findOne({ userId });
        if (!artisan) {
            res.status(404).json({
                success: false,
                message: "Artisan profile not found",
            });
            return;
        }
        const query = { artisanId: artisan._id };
        if (status) {
            query.status = status;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [bookings, total] = await Promise.all([
            Booking_1.default.find(query)
                .populate([
                { path: "customerId", select: "name email phone avatar" },
                {
                    path: "artisanId",
                    select: "businessName category hourlyRate rating reviewCount",
                },
            ])
                .sort({ scheduledDate: 1 })
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
exports.getArtisanBookings = getArtisanBookings;
const updateBookingStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user?.userId;
        const booking = await Booking_1.default.findById(id);
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }
        // Check authorization (only artisan can update status)
        const artisan = await Artisan_1.default.findById(booking.artisanId);
        if (artisan?.userId.toString() !== userId && req.user?.role !== "admin") {
            res.status(403).json({
                success: false,
                message: "Not authorized to update this booking",
            });
            return;
        }
        // Validate status transition
        const validTransitions = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["in-progress", "cancelled"],
            "in-progress": ["completed", "cancelled"],
            completed: [],
            cancelled: [],
        };
        if (!validTransitions[booking.status].includes(status)) {
            res.status(400).json({
                success: false,
                message: `Cannot transition from ${booking.status} to ${status}`,
            });
            return;
        }
        booking.status = status;
        // If completed, update artisan's completed jobs and release escrow
        if (status === "completed") {
            await Artisan_1.default.findByIdAndUpdate(booking.artisanId, {
                $inc: { completedJobs: 1 },
            });
            booking.escrowReleased = true;
        }
        await booking.save();
        res.status(200).json({
            success: true,
            message: "Booking status updated successfully",
            booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateBookingStatus = updateBookingStatus;
const cancelBooking = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?.userId;
        const booking = await Booking_1.default.findById(id);
        if (!booking) {
            res.status(404).json({
                success: false,
                message: "Booking not found",
            });
            return;
        }
        // Check authorization
        const artisan = await Artisan_1.default.findById(booking.artisanId);
        if (booking.customerId.toString() !== userId &&
            artisan?.userId.toString() !== userId &&
            req.user?.role !== "admin") {
            res.status(403).json({
                success: false,
                message: "Not authorized to cancel this booking",
            });
            return;
        }
        // Can only cancel pending or confirmed bookings
        if (!["pending", "confirmed"].includes(booking.status)) {
            res.status(400).json({
                success: false,
                message: "Cannot cancel booking in current status",
            });
            return;
        }
        booking.status = "cancelled";
        booking.cancellationReason = reason;
        // Refund if payment was made
        if (booking.paymentStatus === "paid" && booking.paymentIntentId) {
            try {
                await stripe_1.stripe.refunds.create({
                    payment_intent: booking.paymentIntentId,
                });
                booking.paymentStatus = "refunded";
            }
            catch (stripeError) {
                console.error("Stripe refund error:", stripeError);
            }
        }
        await booking.save();
        res.status(200).json({
            success: true,
            message: "Booking cancelled successfully",
            booking,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelBooking = cancelBooking;
//# sourceMappingURL=bookingController.js.map