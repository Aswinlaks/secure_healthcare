/**
 * Prescriptions Repository
 * 
 * This repository layer handles all direct database operations for the
 * prescriptions module. It provides SQL query abstractions for prescription data.
 * 
 * @module modules/prescriptions/repository
 */

// Database connection pool
const pool = require("../../config/db");

// =============================================================================
// AUTHORIZATION QUERIES
// =============================================================================

/**
 * Check if User is a Doctor
 * 
 * Verifies that a user has the DOCTOR role, which allows them
 * to create prescriptions.
 * 
 * @param {string} userId - User UUID to check
 * @returns {boolean} True if user is a doctor
 */
exports.isDoctor = async (userId) => {
  const q = `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1 AND r.role_name = 'DOCTOR'
  `;
  const { rowCount } = await pool.query(q, [userId]);
  return rowCount > 0;
};

// =============================================================================
// APPOINTMENT QUERIES
// =============================================================================

/**
 * Get Appointment Details
 * 
 * Retrieves appointment information including the assigned doctor
 * for authorization checks.
 * 
 * @param {string} appointmentId - Appointment UUID
 * @returns {Object|undefined} Appointment with appointment_id, patient_id, doctor_id, status
 */
exports.getAppointment = async (appointmentId) => {
  const q = `
    SELECT appointment_id, patient_id, doctor_id, status
    FROM appointments
    WHERE appointment_id = $1
  `;
  const { rows } = await pool.query(q, [appointmentId]);
  return rows[0];
};

// =============================================================================
// PRESCRIPTION CRUD OPERATIONS
// =============================================================================

/**
 * Insert New Prescription
 * 
 * Creates a new prescription record in the database.
 * Uses a transaction client for atomic operations with audit logging.
 * 
 * @param {Object} client - PostgreSQL transaction client
 * @param {Object} data - Prescription data
 * @param {string} data.appointment_id - Appointment UUID
 * @param {string} data.patient_id - Patient UUID
 * @param {string} data.doctor_id - Doctor (prescriber) UUID
 * @param {string} data.medication_id - Medication UUID
 * @param {string} data.dosage - Dosage instructions
 * @param {string} data.frequency - Frequency instructions
 * @param {string} data.start_date - Start date
 * @param {string} data.end_date - End date
 * @returns {string} Created prescription_id UUID
 */
exports.insertPrescription = async (client, data) => {
  const q = `
    INSERT INTO prescriptions (
      appointment_id,
      patient_id,
      doctor_id,
      medication_id,
      dosage,
      frequency,
      start_date,
      end_date,
      is_active
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
    RETURNING prescription_id
  `;
  const values = [
    data.appointment_id,
    data.patient_id,
    data.doctor_id,
    data.medication_id,
    data.dosage,
    data.frequency,
    data.start_date,
    data.end_date
  ];
  const { rows } = await client.query(q, values);
  return rows[0].prescription_id;
};

/**
 * Get Prescriptions by Appointment
 * 
 * Retrieves all prescriptions created during a specific appointment.
 * Results are ordered by most recent first.
 * 
 * @param {string} appointmentId - Appointment UUID
 * @returns {Array} Array of prescription records
 */
exports.getByAppointment = async (appointmentId) => {
  const q = `
    SELECT *
    FROM prescriptions
    WHERE appointment_id = $1
    ORDER BY start_date DESC
  `;
  const { rows } = await pool.query(q, [appointmentId]);
  return rows;
};

/**
 * Get Prescriptions by Patient
 * 
 * Retrieves complete prescription history for a patient across
 * all appointments. Results are ordered by most recent first.
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Array} Array of prescription records
 */
exports.getByPatient = async (patientId) => {
  const q = `
    SELECT *
    FROM prescriptions
    WHERE patient_id = $1
    ORDER BY start_date DESC
  `;
  const { rows } = await pool.query(q, [patientId]);
  return rows;
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Insert Audit Log Entry
 * 
 * Records the prescription creation action in the audit log.
 * Part of the same transaction as prescription insertion.
 * 
 * @param {Object} client - PostgreSQL transaction client
 * @param {string} actorId - Doctor UUID who created prescription
 * @param {string} prescriptionId - Created prescription_id for reference
 */
exports.insertAudit = async (client, actorId, prescriptionId) => {
  const q = `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id
    )
    VALUES ($1, 'CREATE_PRESCRIPTION', 'PRESCRIPTION', $2)
  `;
  await client.query(q, [actorId, prescriptionId]);
};
