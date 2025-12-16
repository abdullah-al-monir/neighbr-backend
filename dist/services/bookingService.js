"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpcomingBookings = exports.createBookingWithValidation = void 0;
const Artisan_1 = __importDefault(require("../models/Artisan"));
const Booking_1 = __importDefault(require("../models/Booking"));
const createBookingWithValidation = async (bookingData) => {
    // Check for overlapping bookings
    const overlapping = await Booking_1.default.findOne({
        artisanId: bookingData.artisanId,
        scheduledDate: bookingData.scheduledDate,
        status: { $in: ['pending', 'confirmed', 'in-progress'] },
        $or: [
            {
                'timeSlot.start': { $lte: bookingData.timeSlot.start },
                'timeSlot.end': { $gt: bookingData.timeSlot.start },
            },
            {
                'timeSlot.start': { $lt: bookingData.timeSlot.end },
                'timeSlot.end': { $gte: bookingData.timeSlot.end },
            },
        ],
    });
    if (overlapping) {
        throw new Error('Time slot not available');
    }
    return await Booking_1.default.create(bookingData);
};
exports.createBookingWithValidation = createBookingWithValidation;
const getUpcomingBookings = async (userId, role) => {
    const query = {
        scheduledDate: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] },
    };
    if (role === 'customer') {
        query.customerId = userId;
    }
    else if (role === 'artisan') {
        const artisan = await Artisan_1.default.findOne({ userId });
        query.artisanId = artisan?._id;
    }
    return await Booking_1.default.find(query)
        .populate('customerId artisanId')
        .sort({ scheduledDate: 1 });
};
exports.getUpcomingBookings = getUpcomingBookings;
//# sourceMappingURL=bookingService.js.map