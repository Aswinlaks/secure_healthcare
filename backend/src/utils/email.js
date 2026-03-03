/**
 * Email Utility
 *
 * Provides OTP email delivery for authentication flows (login MFA,
 * registration, password reset, and account activation).
 *
 * Configuration (from .env):
 *   SMTP_HOST  — e.g. smtp.gmail.com
 *   SMTP_PORT  — 587 (TLS) or 465 (SSL)
 *   SMTP_USER  — Your Gmail address
 *   SMTP_PASS  — Gmail App Password (NOT your normal password)
 *               Generate at: https://myaccount.google.com/apppasswords
 *
 * @module utils/email
 */

const nodemailer = require("nodemailer");

// =============================================================================
// STARTUP CONFIG CHECK
// =============================================================================

if (
  !process.env.SMTP_USER ||
  !process.env.SMTP_PASS ||
  process.env.SMTP_PASS === "YOUR_GMAIL_APP_PASSWORD_HERE"
) {
  console.warn("⚠️  SMTP not fully configured — OTP emails will fail.");
  console.warn("   → Open backend/.env and set SMTP_USER and SMTP_PASS.");
  console.warn("   → Generate a Gmail App Password at:");
  console.warn("     https://myaccount.google.com/apppasswords");
}

// =============================================================================
// SMTP TRANSPORTER
// =============================================================================

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,      // false = STARTTLS on port 587; true = SSL on port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,  // relaxed for local development
  },
});

// =============================================================================
// SEND OTP EMAIL
// =============================================================================

/**
 * Send a one-time password to the given email address.
 *
 * @param {string} userEmail - Recipient email
 * @param {string} otp       - 6-digit OTP code
 */
async function sendOTPEmail(userEmail, otp) {
  if (!userEmail) {
    console.error("❌ No email address provided for OTP delivery");
    throw new Error("Email address is required to send OTP");
  }

  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;

  await transporter.sendMail({
    from: `"Secure Healthcare" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: "Your OTP for Secure Healthcare",
    text: `Your OTP is: ${otp}\n\nValid for ${expiryMinutes} minutes.\n\nIf you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Secure Healthcare — Verification Code</h2>
        <p>Your one-time password (OTP) is:</p>
        <div style="background: #f3f4f6; padding: 24px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #1f2937;">
            ${otp}
          </span>
        </div>
        <p style="color: #6b7280;">
          This code expires in <strong>${expiryMinutes} minutes</strong>.
        </p>
        <p style="color: #6b7280;">
          If you did not request this code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af;">Secure Healthcare Portal</p>
      </div>
    `,
  }).then(() => {
    const masked = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    console.log(`📧 OTP sent successfully to ${masked}`);
  }).catch((error) => {
    console.error(`❌ Failed to send OTP to ${userEmail}:`, error.message);
    throw new Error("Failed to send OTP email. Please try again later.");
  });
}

module.exports = { sendOTPEmail };
