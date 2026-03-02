/**
 * Vitals Repository
 * 
 * This repository layer handles all direct database operations for the
 * vitals module. It provides SQL query abstractions for vital signs data.
 * 
 * @module modules/vitals/repository
 */

// Database connection pool
const pool = require("../../config/db");

// =============================================================================
// AUTHORIZATION QUERIES
// =============================================================================

/**
 * Check if User is a Clinician
 * 
 * Verifies that a user has DOCTOR or NURSE role, which allows them
 * to record patient vital signs.
 * 
 * @param {string} userId - User UUID to check
 * @returns {boolean} True if user is a doctor or nurse
 */
exports.isClinician = async (userId) => {
  const query = `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = $1
      AND r.role_name IN ('DOCTOR', 'NURSE')
  `;
  const { rowCount } = await pool.query(query, [userId]);
  return rowCount > 0;
};

/**
 * Get Patient ID from User ID
 * 
 * Resolves the patient_id for a logged-in patient user.
 * Patients have a separate record linked to their user account.
 * 
 * @param {string} userId - User UUID
 * @returns {Object|undefined} Object with patient_id or undefined
 */
exports.getPatientIdByUserId = async (userId) => {
  const query = `SELECT patient_id FROM patients WHERE user_id = $1`;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

// =============================================================================
// APPOINTMENT QUERIES
// =============================================================================

/**
 * Get Appointment Details
 * 
 * Retrieves basic appointment information for validation purposes.
 * 
 * @param {string} appointmentId - Appointment UUID
 * @returns {Object|undefined} Appointment with appointment_id, patient_id, status
 */
exports.getAppointment = async (appointmentId) => {
  const query = `
    SELECT appointment_id, patient_id, status
    FROM appointments
    WHERE appointment_id = $1
  `;
  const { rows } = await pool.query(query, [appointmentId]);
  return rows[0];
};

// =============================================================================
// VITALS CRUD OPERATIONS
// =============================================================================

/**
 * Insert Vital Signs Record
 * 
 * Creates a new vital signs record in the database.
 * Uses a transaction client for atomic operations.
 * 
 * @param {Object} client - PostgreSQL transaction client
 * @param {Object} data - Vitals data object
 * @param {string} data.appointment_id - Appointment UUID
 * @param {string} data.patient_id - Patient UUID
 * @param {string} data.recorded_by - User UUID who recorded vitals
 * @param {number} data.heart_rate - Heart rate (bpm)
 * @param {number} data.bp_systolic - Systolic BP (mmHg)
 * @param {number} data.bp_diastolic - Diastolic BP (mmHg)
 * @param {number} data.temperature - Body temperature
 * @param {number} data.respiratory_rate - Respiratory rate
 * @param {number} data.oxygen_saturation - SpO2 (%)
 * @returns {string} Created vital_id UUID
 */
exports.insertVitals = async (client, data) => {
  const query = `
    INSERT INTO vital_signs (
      appointment_id,
      patient_id,
      taken_by,
      heart_rate,
      bp_systolic,
      bp_diastolic,
      temperature,
      respiratory_rate,
      oxygen_saturation
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING vital_id
  `;

  const values = [
    data.appointment_id,
    data.patient_id,
    data.recorded_by,
    data.heart_rate,
    data.bp_systolic,
    data.bp_diastolic,
    data.temperature,
    data.respiratory_rate,
    data.oxygen_saturation
  ];

  const { rows } = await client.query(query, values);
  return rows[0].vital_id;
};

/**
 * Get Vitals for an Appointment
 * 
 * Retrieves all vital signs recorded during a specific appointment.
 * Results are ordered by most recent first.
 * 
 * @param {string} appointmentId - Appointment UUID
 * @returns {Array} Array of vital sign records
 */
exports.getAppointmentVitals = async (appointmentId) => {
  const query = `
    SELECT
      vital_id,
      heart_rate,
      bp_systolic,
      bp_diastolic,
      temperature,
      respiratory_rate,
      oxygen_saturation,
      recorded_at
    FROM vital_signs
    WHERE appointment_id = $1
    ORDER BY recorded_at DESC
  `;
  const { rows } = await pool.query(query, [appointmentId]);
  return rows;
};

/**
 * Get Vitals History for a Patient
 * 
 * Retrieves complete vital signs history for a patient across
 * all appointments. Results are ordered by most recent first.
 * 
 * @param {string} patientId - Patient UUID
 * @returns {Array} Array of vital sign records with appointment IDs
 */
exports.getPatientVitals = async (patientId) => {
  const query = `
    SELECT
      v.vital_id,
      v.heart_rate,
      v.bp_systolic,
      v.bp_diastolic,
      v.temperature,
      v.respiratory_rate,
      v.oxygen_saturation,
      v.recorded_at,
      v.appointment_id
    FROM vital_signs v
    WHERE v.patient_id = $1
    ORDER BY v.recorded_at DESC
  `;
  const { rows } = await pool.query(query, [patientId]);
  return rows;
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Insert Audit Log Entry
 * 
 * Records the vitals recording action in the audit log.
 * Part of the same transaction as vitals insertion.
 * 
 * @param {Object} client - PostgreSQL transaction client
 * @param {string} actorUserId - User UUID who recorded vitals
 * @param {string} vitalId - Created vital_id for reference
 */
exports.insertAudit = async (client, actorUserId, vitalId) => {
  const query = `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id
    )
    VALUES ($1, 'RECORD_VITALS', 'VITAL_SIGNS', $2)
  `;
  await client.query(query, [actorUserId, vitalId]);
};
