import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  try {
    const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;

    await transporter.sendMail({
      from: config.emailFrom,
      to: email,
      subject: 'Verify Your Email - Neighbr',
      html: `
        <h1>Welcome to Neighbr!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });

    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  try {
    const resetUrl = `${config.frontendUrl}/reset-password/${token}`;

    await transporter.sendMail({
      from: config.emailFrom,
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

    logger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendBookingConfirmation = async (
  email: string,
  bookingDetails: any
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: config.emailFrom,
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

    logger.info(`Booking confirmation sent to ${email}`);
  } catch (error) {
    logger.error('Error sending booking confirmation:', error);
  }
};