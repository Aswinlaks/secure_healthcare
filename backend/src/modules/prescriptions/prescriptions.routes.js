/**
 * Prescriptions Routes
 * 
 * This module defines API endpoints for managing medication prescriptions.
 * Doctors can create prescriptions during appointments, and prescriptions
 * can be viewed by appointment or patient.
 * 
 * Prescription Data includes:
 * - Medication reference
 * - Dosage and frequency
 * - Start and end dates
 * - Associated appointment and patient
 * 
 * @module modules/prescriptions/routes
 */

const express = require("express");
const router = express.Router();
const controller = require("./prescriptions.controller");

// =============================================================================
// PRESCRIPTION CREATION (Doctors)
// =============================================================================

/**
 * Create New Prescription
 * POST /prescriptions/
 * 
 * Allows doctors to create a medication prescription for a patient
 * during or after an appointment.
 * 
 * @body {string} appointment_id - UUID of the associated appointment
 * @body {string} medication_id - UUID of the medication
 * @body {string} dosage - Dosage instructions (e.g., "500mg")
 * @body {string} frequency - How often to take (e.g., "twice daily")
 * @body {string} start_date - When to start medication
 * @body {string} end_date - When to stop medication
 */
router.post("/", controller.createPrescription);

// =============================================================================
// PRESCRIPTION VIEWING
// =============================================================================

/**
 * Get Prescriptions by Appointment
 * GET /prescriptions/appointments/:appointment_id/prescriptions
 * 
 * Returns all prescriptions created during a specific appointment.
 * 
 * @param {string} appointment_id - UUID of the appointment (URL param)
 * @returns {Object} Object with appointment_id and prescriptions array
 */
router.get(
  "/appointments/:appointment_id/prescriptions",
  controller.getByAppointment
);

/**
 * Get Prescriptions by Patient
 * GET /prescriptions/patients/:patient_id/prescriptions
 * 
 * Returns all prescriptions for a specific patient (across all appointments).
 * Patients can only access their own prescriptions.
 * 
 * @param {string} patient_id - UUID of the patient (URL param)
 * @returns {Object} Object with patient_id and prescriptions array
 */
router.get(
  "/patients/:patient_id/prescriptions",
  controller.getByPatient
);

module.exports = router;
