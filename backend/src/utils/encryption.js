/**
 * General Encryption Utility
 * 
 * This module provides AES-256-CBC encryption and decryption functions
 * for general-purpose data encryption. Used primarily for encrypting
 * lab report results and other sensitive medical data.
 * 
 * Similar to crypto.util.js but uses a different encryption key (ENCRYPTION_KEY)
 * for separation of concerns between PII encryption and general data encryption.
 * 
 * Security Implementation:
 * - Algorithm: AES-256-CBC
 * - Key: 32-character key from ENCRYPTION_KEY environment variable
 * - IV: Random 16-byte Initialization Vector per encryption
 * - Storage Format: "iv:ciphertext"
 * 
 * @module utils/encryption
 */

"use strict";

// Node.js built-in cryptography module
const crypto = require("crypto");

// =============================================================================
// CONFIGURATION
// =============================================================================

// ⚠️ SECURITY: Key MUST be exactly 32 characters for AES-256
// The fallback key is for development only - NEVER use in production
const ENCRYPTION_KEY_RAW =
  process.env.ENCRYPTION_KEY ||
  process.env.PII_ENCRYPTION_KEY ||
  process.env.LAB_SYM_KEY ||
  "12345678901234567890123456789012";

// Normalize key to 32 bytes for AES-256
// If it's 44 chars, it's likely base64 of 32 bytes
let ENCRYPTION_KEY;
if (ENCRYPTION_KEY_RAW.length === 44 && ENCRYPTION_KEY_RAW.endsWith('=')) {
  ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW, 'base64');
} else {
  ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW).slice(0, 32);
}

// Initialization Vector length (16 bytes for AES)
const IV_LENGTH = 16;

// =============================================================================
// ENCRYPTION FUNCTION
// =============================================================================

/**
 * Encrypt Data Using AES-256-CBC
 * 
 * Encrypts plaintext data with a random IV for additional security.
 * Each encryption produces a unique ciphertext even for identical inputs.
 * 
 * @param {string} text - The plaintext data to encrypt
 * @returns {string} Encrypted string in format "iv:ciphertext" (both hex-encoded)
 * 
 * @example
 * const encryptedResult = encrypt(JSON.stringify(labResults));
 * // Store encryptedResult in the database
 */
function encrypt(text) {
  // Generate a cryptographically secure random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher instance with AES-256-CBC algorithm
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  // Encrypt the data: UTF-8 input → hex output
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return IV concatenated with ciphertext, separated by colon
  return iv.toString("hex") + ":" + encrypted;
}

// =============================================================================
// DECRYPTION FUNCTION
// =============================================================================

/**
 * Decrypt Data Using AES-256-CBC
 * 
 * Decrypts ciphertext that was encrypted using the encrypt() function.
 * Parses the "iv:ciphertext" format and uses the IV for decryption.
 * 
 * @param {string} text - The encrypted string in format "iv:ciphertext"
 * @returns {string} Decrypted plaintext data
 * 
 * @example
 * const labResults = JSON.parse(decrypt(encryptedResult));
 */
function decrypt(text) {
  // Split the stored format: "iv:ciphertext" → ["iv", "ciphertext"]
  const parts = text.split(":");

  // Extract IV from the first part
  const iv = Buffer.from(parts.shift(), "hex");

  // Remaining parts form the ciphertext (rejoin in case of multiple colons)
  const encryptedText = parts.join(":");

  // Create decipher instance with same algorithm and key
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv
  );

  // Decrypt the data: hex input → UTF-8 output
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Export encryption utilities for use in lab service, patient service, etc.
module.exports = {
  encrypt,
  decrypt
};
