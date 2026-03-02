/**
 * Email Utility
 * 
 * This module provides email sending functionality for OTP delivery during
 * authentication flows (login MFA, registration, password reset, account activation).
 * 
 * Uses nodemailer with SMTP configuration for sending emails.
 * 
 * Configuration (from .env):
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_USER: SMTP authentication username
 * - SMTP_PASS: SMTP authentication password
 * 
 * @module utils/email
 */

// Nodemailer library for sending emails
const nodemailer = require("nodemailer");

// =============================================================================
// SMTP TRANSPORTER CONFIGURATION
// =============================================================================

/**
 * Email Transporter
 * 
 * Configured nodemailer transporter for sending emails via SMTP.
 * Uses environment variables for server configuration.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,   // SMTP server hostname (e.g., smtp.gmail.com)
  port: 587,                      // Standard SMTP port for TLS
  secure: false,                  // Use TLS (not SSL)
  auth: {
    user: process.env.SMTP_USER, // SMTP username (email address)
    pass: process.env.SMTP_PASS, // SMTP password or app-specific password
  },
});

// =============================================================================
// EMAIL SENDING FUNCTION
// =============================================================================

/**
 * Send OTP Email
 * 
 * Sends a one-time password to the user for verification purposes.
 * Used during:
 * - Login MFA verification
 * - Registration confirmation
 * - Password reset
 * - Account activation
 * 
 * @async
 * @param {string} userEmail - The recipient's email address
 * @param {string} otp - The 6-digit one-time password to send
 * 
 * @example
 * await sendOTPEmail("user@example.com", "123456");
 */
async function sendOTPEmail(userEmail, otp) {
  // Validate that email is provided
  if (!userEmail) {
    console.error("❌ No email address provided for OTP delivery");
    throw new Error("Email address is required to send OTP");
  }

  try {
    await transporter.sendMail({
      from: `"Hospital Auth" <${process.env.SMTP_USER}>`, // Sender name and email
      to: userEmail,                                       // Dynamic recipient email
      subject: "Your OTP for Secure Healthcare",           // Email subject line
      text: `Your OTP is ${otp}. Valid for 2 minutes.`,    // Plain text email body
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Secure Healthcare - Verification Code</h2>
          <p>Your one-time password (OTP) is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
          </div>
          <p style="margin-top: 20px; color: #6b7280;">This code is valid for <strong>2 minutes</strong>.</p>
          <p style="color: #6b7280;">If you did not request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af;">Secure Healthcare Portal</p>
        </div>
      `,
    });

    // Log confirmation for debugging (mask email for privacy)
    const maskedEmail = userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3");
    console.log(`📧 OTP sent successfully to ${maskedEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP to ${userEmail}:`, error.message);
    throw new Error("Failed to send OTP email. Please try again later.");
  }
}

module.exports = { sendOTPEmail };
