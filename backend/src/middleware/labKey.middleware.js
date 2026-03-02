/**
 * Lab Key Middleware
 * 
 * This middleware attaches private keys for digital signatures to the request
 * object. These keys are used by lab technicians and doctors to cryptographically
 * sign lab reports, ensuring authenticity and non-repudiation.
 * 
 * Security Flow:
 * 1. Lab Tech uploads report → signs with LAB_PRIVATE_KEY
 * 2. Doctor verifies report → signs with DOCTOR_PRIVATE_KEY
 * 3. Both signatures are verified using corresponding public keys
 * 
 * @module middleware/labKey
 */

"use strict";

/**
 * Attach Lab Technician Private Key Middleware
 * 
 * For LAB_TECH users, attaches the lab private key to req.labPrivateKey.
 * This key is used to digitally sign lab reports when uploading results.
 * 
 * The private key is stored in environment variables and may contain escaped
 * newlines (\n) which are converted to actual newlines for PEM format.
 * 
 * @param {Object} req - Express request object with req.user from auth middleware
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
module.exports.attachLabPrivateKey = (req, res, next) => {
  // Only attach key for LAB_TECH role - skip for other roles
  if (req.user.role !== "LAB_TECH") {
    return next();
  }

  // Ensure the private key is configured in environment
  if (!process.env.LAB_PRIVATE_KEY) {
    return res.status(500).json({
      error: "Lab private key not configured"
    });
  }

  // Convert escaped newlines back to actual newlines for PEM format
  // Also strip any literal double quotes that might wrap the key in some environments
  let key = process.env.LAB_PRIVATE_KEY.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  req.labPrivateKey = key.replace(/\\n/g, '\n');
  next();
};

/**
 * Attach Doctor Private Key Middleware
 * 
 * For DOCTOR users, attaches the doctor private key to req.doctorPrivateKey.
 * This key is used to digitally sign (verify) lab reports, confirming the
 * doctor has reviewed and approved the results.
 * 
 * @param {Object} req - Express request object with req.user from auth middleware
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
module.exports.attachDoctorPrivateKey = (req, res, next) => {
  // Only attach key for DOCTOR role - skip for other roles
  if (req.user.role !== "DOCTOR") {
    return next();
  }

  // Ensure the private key is configured in environment
  if (!process.env.DOCTOR_PRIVATE_KEY) {
    return res.status(500).json({
      error: "Doctor private key not configured"
    });
  }

  // Convert escaped newlines to actual newlines for PEM format
  let key = process.env.DOCTOR_PRIVATE_KEY.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1);
  }

  req.doctorPrivateKey = key.replace(/\\n/g, '\n');
  next();
};
