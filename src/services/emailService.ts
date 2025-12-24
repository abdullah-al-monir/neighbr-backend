import nodemailer from "nodemailer";
import { config } from "../config/env";

const emailWrapper = (content: string) => `
  <div style="background-color: #0F172A; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #F8FAFC; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
      <div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #67E8F9 0%, #FDBA74 100%);">
        <h1 style="margin: 0; color: #0F172A; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Neighbr</h1>
      </div>
      <div style="padding: 40px 30px;">
        ${content}
      </div>
      <div style="padding: 20px; text-align: center; background-color: #0F172A; border-top: 1px solid #334155;">
        <p style="margin: 0; font-size: 12px; color: #94A3B8;">&copy; ${new Date().getFullYear()} Neighbr Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
`;

const btnStyle = `display: inline-block; padding: 14px 28px; background-color: #FDBA74; color: #0F172A; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;`;

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
  auth: { user: config.smtpUser, pass: config.smtpPass },
});

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;
  const html = emailWrapper(`
    <h2 style="color: #FDBA74; margin-top: 0;">Welcome to the Neighbr!</h2>
    <p>We're excited to have you. Before we get started, please verify your email address to secure your account.</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" style="${btnStyle}">Verify Email Address</a>
    </div>
    <p style="font-size: 14px; color: #94A3B8;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this message.</p>
  `);

  await transporter.sendMail({
    from: config.emailFrom,
    to: email,
    subject: "Verify Your Email - Neighbr",
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${config.frontendUrl}/reset-password/${token}`;
  const html = emailWrapper(`
    <h2 style="color: #FDBA74; margin-top: 0;">Reset Your Password</h2>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" style="${btnStyle}">Reset Password</a>
    </div>
    <p style="font-size: 14px; color: #94A3B8;">This link expires in 1 hour. If you didn't request this, please change your password immediately as a precaution.</p>
  `);

  await transporter.sendMail({
    from: config.emailFrom,
    to: email,
    subject: "Reset Your Password - Neighbr",
    html,
  });
};

export const sendPasswordChangedEmail = async (
  email: string,
  name: string
): Promise<void> => {
  const html = emailWrapper(`
    <h2 style="color: #86EFAC; margin-top: 0;">Security Update</h2>
    <p>Hi ${name},</p>
    <p>This is a confirmation that your Neighbr account password has been <strong>successfully changed</strong>.</p>
    <div style="background-color: #0F172A; padding: 15px; border-radius: 8px; border-left: 4px solid #F87171; margin: 25px 0;">
       <p style="margin: 0; font-size: 14px;"><strong>Not you?</strong> If you didn't make this change, please <a href="#" style="color: #67E8F9;">contact support</a> immediately.</p>
    </div>
  `);

  await transporter.sendMail({
    from: config.emailFrom,
    to: email,
    subject: "Password Changed - Neighbr",
    html,
  });
};

export const sendBookingConfirmation = async (
  email: string,
  bookingDetails: any
): Promise<void> => {
  const html = emailWrapper(`
    <h2 style="color: #FDBA74; margin-top: 0;">Booking Confirmed!</h2>
    <p>Great news! Your booking for <strong>${
      bookingDetails.serviceType
    }</strong> has been confirmed.</p>
    
    <div style="background-color: #334155; padding: 20px; border-radius: 10px; margin: 20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 5px 0; color: #94A3B8;">Date</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold;">${new Date(
            bookingDetails.scheduledDate
          ).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #94A3B8;">Time</td>
          <td style="padding: 5px 0; text-align: right; font-weight: bold;">${
            bookingDetails.timeSlot.start
          } - ${bookingDetails.timeSlot.end}</td>
        </tr>
        <tr>
          <td style="padding: 15px 0 5px 0; border-top: 1px solid #475569; color: #94A3B8;">Total Amount</td>
          <td style="padding: 15px 0 5px 0; border-top: 1px solid #475569; text-align: right; font-weight: bold; font-size: 18px; color: #86EFAC;">$${
            bookingDetails.amount
          }</td>
        </tr>
      </table>
    </div>
    <p>You can view your full booking details in your dashboard.</p>
  `);

  await transporter.sendMail({
    from: config.emailFrom,
    to: email,
    subject: "Booking Confirmed - Neighbr",
    html,
  });
};
