"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundPayment = exports.releaseEscrow = exports.createEscrowPayment = void 0;
const stripe_1 = require("../config/stripe");
const Booking_1 = __importDefault(require("../models/Booking"));
// import Transaction from '../models/Transaction';
const createEscrowPayment = async (bookingId, amount, customerId) => {
    const paymentIntent = await stripe_1.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        metadata: { bookingId, customerId },
    });
    return paymentIntent;
};
exports.createEscrowPayment = createEscrowPayment;
const releaseEscrow = async (bookingId) => {
    const booking = await Booking_1.default.findById(bookingId);
    if (!booking || !booking.paymentIntentId) {
        throw new Error('Invalid booking');
    }
    // Mark escrow as released
    booking.escrowReleased = true;
    await booking.save();
    // Transfer funds to artisan (implement Stripe Connect here)
    return true;
};
exports.releaseEscrow = releaseEscrow;
const refundPayment = async (paymentIntentId) => {
    const refund = await stripe_1.stripe.refunds.create({
        payment_intent: paymentIntentId,
    });
    return refund;
};
exports.refundPayment = refundPayment;
//# sourceMappingURL=paymentService.js.map