/**
 * Vitals Controller
 * 
 * This controller handles HTTP request/response logic for vital signs
 * operations. It delegates business logic to the vitals service layer.
 * 
 * @module modules/vitals/controller
 */

// Import the service layer for business logic
const vitalsService = require("./vitals.service");

// =============================================================================
// RECORDING OPERATIONS
// =============================================================================

/**
 * Record Patient Vitals
 * 
 * Handles POST /vitals/
 * Records vital signs during a patient appointment.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Vitals data (heart_rate, bp, temp, etc.)
 * @param {Object} req.user - Authenticated user (doctor/nurse)
 * @param {Object} res - Express response object
 */
exports.recordVitals = async (req, res) => {
  try {
    // Delegate to service layer with request body and user context
    const result = await vitalsService.recordVitals(
      req.body,
      req.user // User context from auth middleware (may be undefined if not authenticated)
    );

    // Return created vitals with 201 status
    res.status(201).json(result);
  } catch (err) {
    // Return appropriate error status
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

// =============================================================================
// VIEW OPERATIONS
// =============================================================================

/**
 * Get Vitals by Appointment
 * 
 * Handles GET /vitals/appointments/:appointment_id/vitals
 * Returns all vitals recorded for a specific appointment.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.appointment_id - Appointment UUID
 * @param {Object} req.user - Authenticated user (for access control)
 * @param {Object} res - Express response object
 */
exports.getVitalsByAppointment = async (req, res) => {
  try {
    const result = await vitalsService.getVitalsByAppointment(
      req.params.appointment_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

/**
 * Get Vitals by Patient
 * 
 * Handles GET /vitals/patients/:patient_id/vitals
 * Returns complete vitals history for a patient.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.patient_id - Patient UUID
 * @param {Object} req.user - Authenticated user (for access control)
 * @param {Object} res - Express response object
 */
exports.getVitalsByPatient = async (req, res) => {
  try {
    const result = await vitalsService.getVitalsByPatient(
      req.params.patient_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

/**
 * Get My Vitals (Patient)
 * 
 * Handles GET /vitals/my-vitals
 * Returns vitals history for the logged-in patient.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated patient
 * @param {Object} res - Express response object
 */
exports.getMyVitals = async (req, res) => {
  try {
    const result = await vitalsService.getMyVitals(req.user);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};
