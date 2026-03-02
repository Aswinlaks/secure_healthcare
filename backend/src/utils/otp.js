/**
 * OTP (One-Time Password) Utility
 * 
 * This module provides functions for generating and hashing one-time passwords
 * used in multi-factor authentication (MFA) flows throughout the application.
 * 
 * OTP Usage:
 * - Login MFA verification (after password check)
 * - Registration email confirmation
 * - Password reset verification
 * - Account activation
 * 
 * Security:
 * - OTPs are 6-digit numeric codes
 * - Stored as SHA-256 hashes in the database (never plaintext)
 * - Valid for a configurable period (typically 2 minutes)
 * 
 * @module utils/otp
 */

// Node.js built-in cryptography module for secure hashing
const crypto = require("crypto");

/**
 * Generate a 6-Digit OTP
 * 
 * Creates a random 6-digit numeric one-time password. The OTP is generated
 * using Math.random which is suitable for this use case as it's sent via
 * a secure channel (email) and has a short validity period.
 * 
 * @returns {string} A 6-digit numeric string (e.g., "123456")
 * 
 * @example
 * const otp = generateOTP();
 * await sendOTPEmail(user.email, otp);
 * await storeOTPHash(user.id, hashOTP(otp));
 */
function generateOTP() {
  // Generate a number between 100000 and 999999 (always 6 digits)
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash an OTP for Secure Storage
 * 
 * Creates a SHA-256 hash of the OTP for storage in the database.
 * This ensures that even if the database is compromised, the plaintext
 * OTPs cannot be recovered.
 * 
 * @param {string} otp - The plaintext OTP to hash
 * @returns {string} Hexadecimal SHA-256 hash of the OTP
 * 
 * @example
 * const otpHash = hashOTP("123456");
 * // Store otpHash in email_otps table
 */
function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

module.exports = {
  generateOTP,
  hashOTP,
};
