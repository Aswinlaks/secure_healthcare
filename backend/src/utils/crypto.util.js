/**
 * PII Encryption Utility
 * 
 * This module provides AES-256-CBC encryption and decryption functions for
 * protecting Personally Identifiable Information (PII) such as patient names,
 * addresses, and other sensitive data at rest in the database.
 * 
 * Security Implementation:
 * - Algorithm: AES-256-CBC (Advanced Encryption Standard, 256-bit key, Cipher Block Chaining)
 * - Key: 32-byte key from PII_ENCRYPTION_KEY environment variable
 * - IV: Randomly generated 16-byte Initialization Vector for each encryption
 * - Storage Format: "iv:ciphertext" (hex encoded)
 * 
 * @module utils/crypto
 */

// Node.js built-in cryptography module
const crypto = require("crypto");

// =============================================================================
// CONFIGURATION
// =============================================================================

// Encryption algorithm - AES-256 in CBC mode
const algorithm = "aes-256-cbc";

// 🔑 Load the 32-byte encryption key from environment variables
// IMPORTANT: The key must be exactly 32 characters for AES-256
const key = Buffer.from(process.env.PII_ENCRYPTION_KEY, "utf8");

// =============================================================================
// ENCRYPTION FUNCTION
// =============================================================================

/**
 * Encrypt Plaintext Data
 * 
 * Encrypts sensitive PII data using AES-256-CBC encryption.
 * A unique random IV is generated for each encryption to ensure
 * that identical plaintexts produce different ciphertexts.
 * 
 * @param {string} text - The plaintext data to encrypt
 * @returns {string|null} Encrypted string in format "iv:ciphertext" (hex), or null if input is empty
 * 
 * @example
 * const encrypted = encrypt("John Doe");
 * // Returns: "a1b2c3d4....:e5f6g7h8..."
 */
function encrypt(text) {
  // Handle null/empty input gracefully
  if (!text) return null;

  // Generate a random 16-byte Initialization Vector for this encryption
  // Each encryption uses a unique IV for security
  const iv = crypto.randomBytes(16);

  // Create the cipher instance with algorithm, key, and IV
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  // Encrypt the plaintext: input is UTF-8, output is hex-encoded
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Return in format "iv:ciphertext" for storage
  // The IV is needed for decryption and is safe to store alongside ciphertext
  return iv.toString("hex") + ":" + encrypted;
}

// =============================================================================
// DECRYPTION FUNCTION
// =============================================================================

/**
 * Decrypt Encrypted Data
 * 
 * Decrypts data that was encrypted using the encrypt() function.
 * Extracts the IV from the stored format and uses it for decryption.
 * 
 * @param {string} encryptedText - The encrypted string in format "iv:ciphertext"
 * @returns {string|null} Decrypted plaintext, null if input is empty, or original text if format is invalid
 * 
 * @example
 * const decrypted = decrypt("a1b2c3d4....:e5f6g7h8...");
 * // Returns: "John Doe"
 */
function decrypt(encryptedText) {
  // Handle null/empty input gracefully
  if (!encryptedText) return null;

  // Split the stored format to extract IV and ciphertext
  const parts = encryptedText.split(":");

  // Safety check: if format is invalid, return the original text
  // This handles cases where data might not be encrypted (legacy data)
  if (parts.length !== 2) return encryptedText;

  // Extract the IV (first part) and ciphertext (second part)
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  // Create the decipher instance with the same algorithm, key, and extracted IV
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  // Decrypt the ciphertext: input is hex-encoded, output is UTF-8
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Export encryption utilities for use in patient service, auth service, etc.
module.exports = {
  encrypt,
  decrypt
};
