import emailjs from "@emailjs/nodejs";
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

const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  try {
    await emailjs.send(
      config.emailjsServiceId,
      config.emailjsTemplateId,
      {
        to_email: to,
        subject: subject,
        message: htmlContent,
        from_name: "Neighbr",
      },
      {
        publicKey: config.emailjsPublicKey,
        privateKey: config.emailjsPrivateKey,
      }
    );
    console.log("✅ Email sent successfully to:", to);
  } catch (error: any) {
    console.error("EmailJS error:", error);
    throw new Error(`Failed to send email: ${error.text || error.message}`);
  }
};

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

  await sendEmail(email, "Verify Your Email - Neighbr", html);
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

  await sendEmail(email, "Reset Your Password - Neighbr", html);
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

  await sendEmail(email, "Password Changed - Neighbr", html);
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
    <p style="font-size: 14px; color: #94A3B8; margin-top: 30px;">We'll notify you once the artisan responds to your booking request.</p>
  `);

  await sendEmail(email, "Booking Confirmed - Neighbr", html);
};

export const sendContactConfirmation = async (
  email: string,
  firstName: string,
  subject: string
): Promise<void> => {
  const html = emailWrapper(`
    <h2 style="color: #FDBA74; margin-top: 0;">We Received Your Message</h2>
    <p>Hi ${firstName},</p>
    <p>Thank you for reaching out to Neighbr. We have successfully received your message regarding "<strong>${subject}</strong>".</p>
    
    <div style="background-color: #334155; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #67E8F9;">
      <p style="margin: 0; font-size: 14px; line-height: 1.8;">
        <strong style="color: #67E8F9;">What happens next?</strong><br/>
        Our support team will review your inquiry and get back to you within <strong>24 hours</strong>. We're committed to providing you with the best possible assistance.
      </p>
    </div>
    
    <p>In the meantime, feel free to explore our platform or check out our <a href="${config.frontendUrl}/help" style="color: #67E8F9; text-decoration: none;">Help Center</a> for instant answers to common questions.</p>
    
    <p style="margin-top: 30px;">Best regards,<br/><strong style="color: #FDBA74;">The Neighbr Team</strong></p>
    
    <p style="font-size: 12px; color: #94A3B8; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155;">
      If you have any urgent concerns, please don't hesitate to reach out to us directly at <a href="mailto:support@neighbr.com" style="color: #67E8F9;">support@neighbr.com</a>
    </p>
  `);

  await sendEmail(email, "We Received Your Message - Neighbr", html);
};

