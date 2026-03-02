/**
 * Appointments Routes
 * 
 * This module defines API endpoints for managing medical appointments between
 * patients and doctors. Patients can book appointments and view their schedule,
 * while doctors can view their assigned appointments.
 * 
 * @module modules/appointments/routes
 */

const express = require('express');
const router = express.Router();
const controller = require('./appointments.controller');

// Import authentication and authorization middleware
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// =============================================================================
// PATIENT ENDPOINTS
// =============================================================================

/**
 * Book a New Appointment
 * POST /appointments/
 * 
 * Allows patients to schedule appointments with doctors. Validates doctor
 * availability and prevents double-booking.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - PATIENT role required
 * 
 * @body {string} doctor_id - UUID of the doctor (optional if doctor_name provided)
 * @body {string} doctor_name - Doctor's name for lookup (optional if doctor_id provided)
 * @body {string} scheduled_start - ISO datetime for appointment start
 * @body {string} scheduled_end - ISO datetime for appointment end
 * @body {string} reason - Reason for the appointment
 */
router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  controller.bookAppointment
);

/**
 * Get Patient's Appointments
 * GET /appointments/my-appointments
 * 
 * Returns all appointments for the currently logged-in patient.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - PATIENT role required
 * 
 * @returns {Array} List of appointments with doctor details
 */
router.get(
  "/my-appointments",
  authenticate,
  authorize("PATIENT"),
  controller.getMyAppointments
);

// =============================================================================
// DOCTOR ENDPOINTS
// =============================================================================

/**
 * Get Doctor's Appointments
 * GET /appointments/doctor
 * 
 * Returns all appointments assigned to the currently logged-in doctor.
 * Includes patient information (decrypted) for each appointment.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - DOCTOR role required
 * 
 * @returns {Array} List of appointments with patient details
 */
router.get(
  "/doctor",
  authenticate,
  authorize("DOCTOR"),
  controller.getDoctorAppointments
);

/**
 * Update Availability
 * POST /appointments/availability
 */
router.post(
  "/availability",
  authenticate,
  authorize("DOCTOR"),
  controller.updateAvailability
);

/**
 * Get Availability
 * GET /appointments/availability
 */
router.get(
  "/availability",
  authenticate,
  authorize("DOCTOR"),
  controller.getAvailability
);

module.exports = router;
