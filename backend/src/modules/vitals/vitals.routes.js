/**
 * Vitals Routes
 * 
 * This module defines API endpoints for recording and viewing patient vital
 * signs. Vitals are recorded by doctors/nurses during appointments and can
 * be viewed by patients or medical staff.
 * 
 * Vital Signs Tracked:
 * - Heart rate (bpm)
 * - Blood pressure (systolic/diastolic mmHg)
 * - Temperature (°F or °C)
 * - Respiratory rate (breaths per minute)
 * - Oxygen saturation (SpO2 %)
 * 
 * @module modules/vitals/routes
 */

const express = require("express");
const router = express.Router();
const controller = require("./vitals.controller");

// Import authentication and authorization middleware
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// =============================================================================
// VITALS RECORDING (Clinical Staff)
// =============================================================================

/**
 * Record Patient Vitals
 * POST /vitals/
 * 
 * Records vital signs for a patient during an appointment.
 * Only doctors and nurses can record vitals.
 * 
 * @body {string} appointment_id - UUID of the appointment
 * @body {string} patient_id - UUID of the patient
 * @body {number} heart_rate - Heart rate in bpm
 * @body {number} bp_systolic - Systolic blood pressure (mmHg)
 * @body {number} bp_diastolic - Diastolic blood pressure (mmHg)
 * @body {number} temperature - Body temperature
 * @body {number} respiratory_rate - Respiratory rate
 * @body {number} oxygen_saturation - SpO2 percentage
 */
router.post("/", controller.recordVitals);

// =============================================================================
// PATIENT VITALS VIEW
// =============================================================================

/**
 * Get My Vitals (Patient)
 * GET /vitals/my-vitals
 * 
 * Returns all vitals history for the logged-in patient.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - PATIENT role required
 * 
 * @returns {Object} Object with patient_id and vitals array
 */
router.get(
  "/my-vitals",
  authenticate,
  authorize("PATIENT"),
  controller.getMyVitals
);

// =============================================================================
// CLINICAL STAFF VITALS VIEW
// =============================================================================

/**
 * Get Vitals by Appointment
 * GET /vitals/appointments/:appointment_id/vitals
 * 
 * Returns all vitals recorded during a specific appointment.
 * Used by doctors to review vitals before/during consultation.
 * 
 * @param {string} appointment_id - UUID of the appointment (URL param)
 * @returns {Object} Object with appointment_id and vitals array
 */
router.get(
  "/appointments/:appointment_id/vitals",
  controller.getVitalsByAppointment
);

/**
 * Get Vitals by Patient
 * GET /vitals/patients/:patient_id/vitals
 * 
 * Returns complete vitals history for a specific patient.
 * Used by doctors to review patient's vitals trends.
 * 
 * @param {string} patient_id - UUID of the patient (URL param)
 * @returns {Object} Object with patient_id and vitals array
 */
router.get(
  "/patients/:patient_id/vitals",
  controller.getVitalsByPatient
);

module.exports = router;
