"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingConfirmation = exports.sendPasswordResetEmail = exports.sendVerificationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const transporter = nodemailer_1.default.createTransport({
    host: env_1.config.smtpHost,
    port: env_1.config.smtpPort,
    secure: false,
    auth: {
        user: env_1.config.smtpUser,
        pass: env_1.config.smtpPass,
    },
});
const sendVerificationEmail = async (email, token) => {
    try {
        const verificationUrl = `${env_1.config.frontendUrl}/verify-email/${token}`;
        await transporter.sendMail({
            from: env_1.config.emailFrom,
            to: email,
            subject: 'Verify Your Email - Neighbr',
            html: `
        <h1>Welcome to Neighbr!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
        });
        logger_1.logger.info(`Verification email sent to ${email}`);
    }
    catch (error) {
        logger_1.logger.error('Error sending verification email:', error);
        throw error;
    }
};
exports.sendVerificationEmail = sendVerificationEmail;
const sendPasswordResetEmail = async (email, token) => {
    try {
        const resetUrl = `${env_1.config.frontendUrl}/reset-password/${token}`;
        await transporter.sendMail({
            from: env_1.config.emailFrom,
            to: email,
            subject: 'Reset Your Password - Neighbr',
            html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
        });
        logger_1.logger.info(`Password reset email sent to ${email}`);
    }
    catch (error) {
        logger_1.logger.error('Error sending password reset email:', error);
        throw error;
    }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendBookingConfirmation = async (email, bookingDetails) => {
    try {
        await transporter.sendMail({
            from: env_1.config.emailFrom,
            to: email,
            subject: 'Booking Confirmed - Neighbr',
            html: `
        <h1>Booking Confirmed!</h1>
        <p>Your booking has been confirmed.</p>
        <p><strong>Service:</strong> ${bookingDetails.serviceType}</p>
        <p><strong>Date:</strong> ${new Date(bookingDetails.scheduledDate).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${bookingDetails.timeSlot.start} - ${bookingDetails.timeSlot.end}</p>
        <p><strong>Amount:</strong> $${bookingDetails.amount}</p>
      `,
        });
        logger_1.logger.info(`Booking confirmation sent to ${email}`);
    }
    catch (error) {
        logger_1.logger.error('Error sending booking confirmation:', error);
    }
};
exports.sendBookingConfirmation = sendBookingConfirmation;
//# sourceMappingURL=emailService.js.map