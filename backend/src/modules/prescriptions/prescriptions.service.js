/**
 * Prescriptions Service
 * 
 * This service layer contains business logic for medication prescription
 * management. Handles validation, authorization, and coordinates database
 * operations through the repository layer.
 * 
 * Key Responsibilities:
 * - Verify doctor authorization
 * - Validate appointment-doctor relationships
 * - Enforce patient-only access for own prescriptions
 * - Manage database transactions for creation
 * 
 * @module modules/prescriptions/service
 */

// Database connection pool for transactions
const pool = require("../../config/db");

// Repository layer for database operations
const repo = require("./prescriptions.repository");

// =============================================================================
// PRESCRIPTION CREATION
// =============================================================================

/**
 * Create Prescription
 * 
 * Creates a new medication prescription for a patient.
 * 
 * Validation Steps:
 * 1. Verify user is a doctor
 * 2. Verify appointment exists
 * 3. Verify doctor is assigned to the appointment
 * 4. Insert prescription in transaction with audit log
 * 
 * @param {Object} data - Prescription data
 * @param {string} data.appointment_id - Appointment UUID
 * @param {string} data.medication_id - Medication UUID
 * @param {string} data.dosage - Dosage instructions
 * @param {string} data.frequency - Frequency instructions
 * @param {string} data.start_date - Start date
 * @param {string} data.end_date - End date
 * @param {Object} user - Authenticated user
 * @returns {Object} Created prescription with ID and success message
 * @throws {Error} 403 if not a doctor or not assigned to appointment, 404 if appointment not found
 */
exports.createPrescription = async (data, user) => {
  const {
    appointment_id,
    medication_id,
    dosage,
    frequency,
    start_date,
    end_date
  } = data;

  // Determine the doctor ID (from auth or request body fallback)
  const doctorId = user?.user_id || data.doctor_id;

  // 1️⃣ Doctor-only - verify user has DOCTOR role
  const isDoctor = await repo.isDoctor(doctorId);
  if (!isDoctor) {
    const err = new Error("Only doctors can prescribe medication");
    err.status = 403;
    throw err;
  }

  // 2️⃣ Validate appointment exists
  const appointment = await repo.getAppointment(appointment_id);
  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  // 3️⃣ Verify doctor is assigned to this appointment
  if (appointment.doctor_id !== doctorId) {
    const err = new Error("Doctor not assigned to this appointment");
    err.status = 403;
    throw err;
  }

  // 4️⃣ Begin transaction for atomic insert
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert prescription record
    const prescriptionId = await repo.insertPrescription(client, {
      appointment_id,
      patient_id: appointment.patient_id, // Get patient from appointment
      doctor_id: doctorId,
      medication_id,
      dosage,
      frequency,
      start_date,
      end_date
    });

    // Create audit log entry
    await repo.insertAudit(client, doctorId, prescriptionId);

    await client.query("COMMIT");

    return {
      prescription_id: prescriptionId,
      message: "Prescription created successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

// =============================================================================
// PRESCRIPTION VIEWING
// =============================================================================

/**
 * Get Prescriptions by Appointment
 * 
 * Retrieves all prescriptions created during a specific appointment.
 * 
 * @param {string} appointmentId - Appointment UUID
 * @param {Object} user - Authenticated user (for future access control)
 * @returns {Object} Object with appointment_id and prescriptions array
 */
exports.getByAppointment = async (appointmentId, user) => {
  return {
    appointment_id: appointmentId,
    prescriptions: await repo.getByAppointment(appointmentId)
  };
};

/**
 * Get Prescriptions by Patient
 * 
 * Retrieves all prescriptions for a patient across all appointments.
 * Patients can only view their own prescriptions.
 * 
 * @param {string} patientId - Patient UUID
 * @param {Object} user - Authenticated user for access control
 * @returns {Object} Object with patient_id and prescriptions array
 * @throws {Error} 403 if patient tries to view another patient's prescriptions
 */
exports.getByPatient = async (patientId, user) => {
  // Patient can only view own prescriptions
  if (user?.role === "PATIENT" && user.patient_id !== patientId) {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  return {
    patient_id: patientId,
    prescriptions: await repo.getByPatient(patientId)
  };
};
