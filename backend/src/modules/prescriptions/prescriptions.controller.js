/**
 * Prescriptions Controller
 * 
 * This controller handles HTTP request/response logic for prescription
 * operations. It delegates business logic to the prescriptions service layer.
 * 
 * @module modules/prescriptions/controller
 */

// Import the service layer for business logic
const service = require("./prescriptions.service");

// =============================================================================
// PRESCRIPTION CREATION
// =============================================================================

/**
 * Create New Prescription
 * 
 * Handles POST /prescriptions/
 * Allows doctors to create medication prescriptions for patients.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Prescription data
 * @param {Object} req.user - Authenticated doctor
 * @param {Object} res - Express response object
 */
exports.createPrescription = async (req, res) => {
  try {
    // Delegate to service layer with prescription data and user context
    const result = await service.createPrescription(req.body, req.user);

    // Return created prescription with 201 status
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

// =============================================================================
// PRESCRIPTION VIEWING
// =============================================================================

/**
 * Get Prescriptions by Appointment
 * 
 * Handles GET /prescriptions/appointments/:appointment_id/prescriptions
 * Returns all prescriptions from a specific appointment.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.appointment_id - Appointment UUID
 * @param {Object} req.user - Authenticated user for access control
 * @param {Object} res - Express response object
 */
exports.getByAppointment = async (req, res) => {
  try {
    const result = await service.getByAppointment(
      req.params.appointment_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * Get Prescriptions by Patient
 * 
 * Handles GET /prescriptions/patients/:patient_id/prescriptions
 * Returns all prescriptions for a patient.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.patient_id - Patient UUID
 * @param {Object} req.user - Authenticated user for access control
 * @param {Object} res - Express response object
 */
exports.getByPatient = async (req, res) => {
  try {
    const result = await service.getByPatient(
      req.params.patient_id,
      req.user
    );
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
