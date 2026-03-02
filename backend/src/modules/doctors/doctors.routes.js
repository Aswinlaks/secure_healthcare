/**
 * Doctors Routes
 * 
 * This module defines API endpoints for doctor-related operations.
 * Currently provides a listing of active doctors for use in appointment
 * booking and patient assignment features.
 * 
 * @module modules/doctors/routes
 */

const express = require("express");
const router = express.Router();

// Controller containing route handlers
const controller = require("./doctors.controller");

// Authentication middleware
const { authenticate } = require("../../middleware/auth.middleware");

// =============================================================================
// ENDPOINTS
// =============================================================================

/**
 * Get All Active Doctors
 * GET /doctors/
 * 
 * Returns a list of all active doctors for use in:
 * - Appointment booking dropdown
 * - Patient care assignment
 * - Admin user management views
 * 
 * Note: This route requires authentication. For public registration where
 * doctor selection might be needed, consider creating a public endpoint.
 * 
 * @requires Authentication - Valid JWT token required
 * 
 * @returns {Array} List of doctors with doctor_id, full_name, and specialization
 */
router.get("/", authenticate, controller.getAllDoctors);

module.exports = router;
