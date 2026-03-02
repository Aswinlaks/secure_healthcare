/**
 * Vitals Service
 * 
 * This service layer contains business logic for vital signs management.
 * Handles validation, role-based access control, and coordinates database
 * operations through the repository layer.
 * 
 * Key Responsibilities:
 * - Validate clinician authorization for recording
 * - Verify appointment-patient relationships
 * - Enforce patient-only access for own vitals
 * - Manage database transactions for recording
 * 
 * @module modules/vitals/service
 */

// Database connection pool for transactions
const pool = require("../../config/db");

// Repository layer for database operations
const repo = require("./vitals.repository");

// =============================================================================
// RECORDING OPERATIONS
// =============================================================================

/**
 * Record Patient Vitals
 * 
 * Records vital signs for a patient during an appointment.
 * 
 * Validation Steps:
 * 1. Verify user is a clinician (DOCTOR or NURSE)
 * 2. Verify appointment exists
 * 3. Verify patient matches appointment
 * 4. Insert vitals in transaction with audit log
 * 
 * @param {Object} data - Vitals data
 * @param {string} data.appointment_id - Appointment UUID
 * @param {string} data.patient_id - Patient UUID
 * @param {number} data.heart_rate - Heart rate in bpm
 * @param {number} data.bp_systolic - Systolic BP (mmHg)
 * @param {number} data.bp_diastolic - Diastolic BP (mmHg)
 * @param {number} data.temperature - Body temperature
 * @param {number} data.respiratory_rate - Breaths per minute
 * @param {number} data.oxygen_saturation - SpO2 percentage
 * @param {string} data.recorded_by - Fallback user ID if not authenticated
 * @param {Object} user - Authenticated user object
 * @returns {Object} Created vital with vital_id and success message
 * @throws {Error} 403 if not a clinician, 404 if appointment not found, 400 if patient mismatch
 */
exports.recordVitals = async (data, user) => {
  const {
    appointment_id,
    patient_id,
    heart_rate,
    bp_systolic,
    bp_diastolic,
    temperature,
    respiratory_rate,
    oxygen_saturation,
    recorded_by
  } = data;

  // Determine the user performing the action (authenticated or from request body)
  const actorUserId = user?.user_id || recorded_by;

  // 1️⃣ Role check - only doctors and nurses can record vitals
  const allowed = await repo.isClinician(actorUserId);
  if (!allowed) {
    const err = new Error("Only doctors or nurses can record vitals");
    err.status = 403;
    throw err;
  }

  // 2️⃣ Appointment validation
  const appointment = await repo.getAppointment(appointment_id);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  // 3️⃣ Patient-appointment relationship validation
  if (appointment.patient_id !== patient_id) {
    const err = new Error("Patient does not match appointment");
    err.status = 400;
    throw err;
  }

  // 4️⃣ Begin transaction for atomic insert
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert vitals record
    const vitalId = await repo.insertVitals(client, {
      appointment_id,
      patient_id,
      recorded_by: actorUserId,
      heart_rate,
      bp_systolic,
      bp_diastolic,
      temperature,
      respiratory_rate,
      oxygen_saturation
    });

    // Create audit log entry
    await repo.insertAudit(client, actorUserId, vitalId);

    await client.query("COMMIT");

    return {
      vital_id: vitalId,
      message: "Vitals recorded successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// =============================================================================
// VIEW OPERATIONS
// =============================================================================

/**
 * Get Vitals by Appointment
 * 
 * Retrieves all vitals recorded during a specific appointment.
 * Patients can only view vitals from their own appointments.
 * 
 * @param {string} appointmentId - Appointment UUID
 * @param {Object} user - Authenticated user for access control
 * @returns {Object} Object with appointment_id and vitals array
 * @throws {Error} 404 if appointment not found, 403 if unauthorized
 */
exports.getVitalsByAppointment = async (appointmentId, user) => {
  // Verify appointment exists
  const appointment = await repo.getAppointment(appointmentId);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  // Patient can only view own appointment vitals
  if (user?.role === "PATIENT" && user.patient_id !== appointment.patient_id) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return {
    appointment_id: appointmentId,
    vitals: await repo.getAppointmentVitals(appointmentId)
  };
};

/**
 * Get Vitals by Patient ID
 * 
 * Retrieves complete vitals history for a patient.
 * Patients can only view their own vitals.
 * 
 * @param {string} patientId - Patient UUID
 * @param {Object} user - Authenticated user for access control
 * @returns {Object} Object with patient_id and vitals array
 * @throws {Error} 403 if patient tries to view another patient's vitals
 */
exports.getVitalsByPatient = async (patientId, user) => {
  // Patient can only view own vitals
  if (user?.role === "PATIENT" && user.patient_id !== patientId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return {
    patient_id: patientId,
    vitals: await repo.getPatientVitals(patientId)
  };
};

/**
 * Get My Vitals (for logged-in patient)
 * 
 * Convenience method for patients to get their own vitals using
 * the authenticated user's context to resolve patient_id.
 * 
 * @param {Object} user - Authenticated patient
 * @returns {Object} Object with patient_id and vitals array
 * @throws {Error} 403 if not a patient, 404 if patient profile not found
 */
exports.getMyVitals = async (user) => {
  // Role check - must be a patient
  if (user.role !== "PATIENT") {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  // Resolve patient_id from user_id
  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found");
    err.status = 404;
    throw err;
  }

  return {
    patient_id: patient.patient_id,
    vitals: await repo.getPatientVitals(patient.patient_id)
  };
};
