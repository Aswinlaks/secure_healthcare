/**
 * Patient Routes
 * 
 * This module defines API endpoints for patient management operations.
 * Allows administrators and doctors to create patient records and view
 * patient listings.
 * 
 * Patient creation has two modes:
 * 1. Create patient without user account (for legacy/manual records)
 * 2. Register patient with user account (for portal access)
 * 
 * @module modules/patients/routes
 */

const express = require("express");
const router = express.Router();
const controller = require("./patient.controller");

// Import authentication and authorization middleware
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// =============================================================================
// PATIENT CREATION ENDPOINTS
// =============================================================================

/**
 * Create Patient (without user account)
 * POST /patients/
 * 
 * Creates a patient record without linking to a user account.
 * Useful for legacy patient records or manual data entry.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN or DOCTOR role required
 * 
 * @body {string} full_name - Patient's full name (will be encrypted)
 * @body {string} dob - Date of birth
 * @body {string} gender - Gender
 * @body {string} blood_group - Blood group
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN", "DOCTOR"),
  controller.createPatient
);

/**
 * Register Patient with User Account
 * POST /patients/register
 * 
 * Creates a patient record AND a linked user account.
 * Allows the patient to log into the portal after registration.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN or DOCTOR role required
 * 
 * @body {string} username - Unique username for login
 * @body {string} password - Password for login
 * @body {string} full_name - Patient's full name (will be encrypted)
 * @body {string} dob - Date of birth
 * @body {string} gender - Gender
 * @body {string} blood_group - Blood group
 */
router.post(
  "/register",
  authenticate,
  authorize("ADMIN", "DOCTOR"),
  controller.registerPatientWithUser
);

// =============================================================================
// PATIENT LISTING ENDPOINTS
// =============================================================================

/**
 * Get All Patients
 * GET /patients/
 * 
 * Returns a list of all patients. Patient names are decrypted
 * only for authorized roles (ADMIN, DOCTOR, NURSE).
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN, DOCTOR, or NURSE role required
 * 
 * @returns {Array} List of patient records with decrypted names
 */
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "DOCTOR", "NURSE"),
  controller.getAll
);

module.exports = router;
