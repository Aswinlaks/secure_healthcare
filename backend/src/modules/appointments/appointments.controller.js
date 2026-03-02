/**
 * Appointments Controller
 * 
 * This controller handles HTTP request/response logic for appointment-related
 * operations. It delegates business logic to the appointments service layer.
 * 
 * The controller pattern separates HTTP concerns from business logic,
 * making the code more testable and maintainable.
 * 
 * @module modules/appointments/controller
 */

// Import the service layer for business logic
const appointmentsService = require('./appointments.service');

// =============================================================================
// PATIENT ENDPOINTS
// =============================================================================

/**
 * Book a New Appointment
 * 
 * Handles POST /appointments/
 * Creates a new appointment booking for the logged-in patient.
 * 
 * Request body should contain:
 * - doctor_id or doctor_name: Doctor to book with
 * - scheduled_start: Appointment start datetime
 * - scheduled_end: Appointment end datetime
 * - reason: Reason for visit
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Appointment details
 * @param {Object} req.user - Authenticated user from auth middleware
 * @param {Object} res - Express response object
 */
exports.bookAppointment = async (req, res) => {
  try {
    // Delegate to service layer, passing request body and authenticated user
    const result = await appointmentsService.bookAppointment(
      req.body,
      req.user  // User context from authentication middleware
    );

    // Return success with created appointment details
    res.status(201).json(result);
  } catch (err) {
    // Return error with appropriate status code (default to 500)
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

// =============================================================================
// DOCTOR ENDPOINTS
// =============================================================================

/**
 * Get Doctor's Appointments
 * 
 * Handles GET /appointments/doctor
 * Returns all appointments assigned to the logged-in doctor.
 * 
 * Patient names are decrypted before being returned.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated doctor from auth middleware
 * @param {Object} res - Express response object
 */
exports.getDoctorAppointments = async (req, res) => {
  try {
    // Fetch appointments for the authenticated doctor
    const appointments = await appointmentsService.getDoctorAppointments(
      req.user
    );

    res.status(200).json(appointments);
  } catch (err) {
    // Log error for debugging (can be removed in production)
    console.error("Error fetching doctor appointments:", err);
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

/**
 * Get Patient's Own Appointments
 * 
 * Handles GET /appointments/my-appointments
 * Returns all appointments for the logged-in patient.
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated patient from auth middleware
 * @param {Object} res - Express response object
 */
exports.getMyAppointments = async (req, res) => {
  try {
    // Fetch appointments for the authenticated patient
    const appointments = await appointmentsService.getPatientAppointments(
      req.user
    );
    res.status(200).json(appointments);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

// =============================================================================
// AVAILABILITY MANAGEMENT
// =============================================================================

/**
 * Update Doctor Availability
 * 
 * Handles POST /appointments/availability
 * Updates the logged-in doctor's availability schedule.
 * 
 * Request body:
 * Array of { dayOfWeek: 1-7, startTime: "HH:MM", endTime: "HH:MM", isActive: boolean }
 */
exports.updateAvailability = async (req, res) => {
  try {
    const updatedSchedule = await appointmentsService.updateDoctorAvailability(
      req.user,
      req.body
    );
    res.status(200).json(updatedSchedule);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};

/**
 * Get Doctor Availability
 * 
 * Handles GET /appointments/availability
 * Returns the logged-in doctor's schedule.
 */
exports.getAvailability = async (req, res) => {
  try {
    const schedule = await appointmentsService.getDoctorAvailability(req.user);
    res.status(200).json(schedule);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message
    });
  }
};
