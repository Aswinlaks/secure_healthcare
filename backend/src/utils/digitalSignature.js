/**
 * Digital Signature Utility
 * 
 * This module provides cryptographic functions for creating and verifying
 * digital signatures on lab reports. It implements a dual-signature scheme
 * where both the lab technician and doctor must sign reports.
 * 
 * Signature Workflow:
 * 1. Lab tech creates report → hashData(encrypted_result) → signHash(hash, lab_private_key)
 * 2. Doctor verifies report → verifySignature(hash, lab_signature, lab_public_key)
 * 3. Doctor approves → signHash(hash, doctor_private_key)
 * 4. Patient views → verifySignature for both signatures
 * 
 * Algorithms Used:
 * - Hash: SHA-256 for creating report fingerprints
 * - Signature: RSA with SHA-256 for signing and verification
 * 
 * @module utils/digitalSignature
 */

// Node.js built-in cryptography module
const crypto = require("crypto");

// =============================================================================
// HASHING FUNCTION
// =============================================================================

/**
 * Create SHA-256 Hash of Data
 * 
 * Generates a cryptographic hash (fingerprint) of the input data.
 * This hash uniquely represents the data - any change to the data
 * will result in a completely different hash.
 * 
 * @param {string} data - The data to hash (typically encrypted lab results)
 * @returns {string} Hexadecimal representation of the SHA-256 hash
 * 
 * @example
 * const hash = hashData("encrypted_lab_result_string");
 * // Returns: "a1b2c3d4e5f6..."
 */
exports.hashData = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

// =============================================================================
// SIGNING FUNCTION
// =============================================================================

/**
 * Sign a Hash with Private Key
 * 
 * Creates a digital signature of the hash using an RSA private key.
 * This proves that the signer possesses the private key and has
 * seen/approved the specific hash value.
 * 
 * @param {string} hash - The SHA-256 hash to sign (from hashData)
 * @param {string} privateKeyPem - The RSA private key in PEM format
 * @returns {string} Base64-encoded digital signature
 * 
 * @example
 * const signature = signHash(reportHash, process.env.LAB_PRIVATE_KEY);
 */
exports.signHash = (hash, privateKeyPem) => {
  return crypto.sign(
    "sha256",           // Algorithm used for signing
    Buffer.from(hash),  // The hash to sign (converted to buffer)
    privateKeyPem       // RSA private key in PEM format
  ).toString("base64"); // Return as base64 string for storage
};

// =============================================================================
// VERIFICATION FUNCTION
// =============================================================================

/**
 * Verify a Digital Signature
 * 
 * Verifies that a signature was created by the holder of the corresponding
 * private key. Returns true only if:
 * 1. The signature is valid for the given hash
 * 2. The signature was created with the private key matching this public key
 * 
 * @param {string} hash - The original SHA-256 hash that was signed
 * @param {string} signature - The base64-encoded signature to verify
 * @param {string} publicKeyPem - The RSA public key in PEM format
 * @returns {boolean} True if signature is valid, false otherwise
 * 
 * @example
 * const isValid = verifySignature(reportHash, labTechSignature, labPublicKey);
 * if (!isValid) throw new Error("Lab technician signature verification failed");
 */
exports.verifySignature = (hash, signature, publicKeyPem) => {
  return crypto.verify(
    "sha256",                           // Algorithm used for verification
    Buffer.from(hash),                  // The hash that was originally signed
    publicKeyPem,                       // RSA public key in PEM format
    Buffer.from(signature, "base64")    // The signature to verify (decoded from base64)
  );
};
