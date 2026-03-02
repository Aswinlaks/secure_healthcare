/**
 * Appointments Repository
 * 
 * This repository layer handles all direct database operations for the
 * appointments module. It provides a clean abstraction over SQL queries,
 * making the service layer independent of database implementation details.
 * 
 * Pattern: Repository Pattern
 * - Single responsibility: Only database access logic
 * - Easy to test: Can be mocked for unit tests
 * - Reusable: Queries can be used by multiple services
 * 
 * @module modules/appointments/repository
 */

// Database connection pool
const pool = require("../../config/db");

// =============================================================================
// DOCTOR-RELATED QUERIES
// =============================================================================

/**
 * Get All Appointments for a Doctor
 * 
 * Fetches appointments for the logged-in doctor, including patient details.
 * Patient name is encrypted in the database and needs to be decrypted by caller.
 * 
 * @param {string} doctorUserId - The doctor's user_id (not doctor_id)
 * @returns {Array} Array of appointment records with patient info
 */
exports.getAppointmentsForDoctor = async (doctorUserId) => {
  const query = `
    SELECT
      a.appointment_id,
      a.scheduled_start,
      a.scheduled_end,
      a.status,
      a.reason,
      p.patient_id,
      p.full_name_encrypted as patient_name,
      p.dob as date_of_birth
    FROM appointments a
    JOIN patients p ON a.patient_id = p.patient_id
    JOIN users u ON p.user_id = u.user_id
    JOIN doctors d ON a.doctor_id = d.doctor_id
    WHERE d.user_id = $1
    ORDER BY a.scheduled_start ASC
  `;

  const { rows } = await pool.query(query, [doctorUserId]);
  return rows;
};

/**
 * Look Up Doctor by Name
 * 
 * Finds a doctor by their full name (case-insensitive).
 * Used when booking by doctor name instead of ID.
 * 
 * @param {string} doctor_name - Doctor's full name
 * @returns {Object|undefined} Doctor record with doctor_id, or undefined if not found
 */
exports.getDoctorByName = async (doctor_name) => {
  const result = await pool.query(
    `
    SELECT doctor_id
    FROM doctors
    WHERE LOWER(full_name) = LOWER($1)
      AND is_active = true
    `,
    [doctor_name]
  );

  return result.rows[0];
};

/**
 * Check if User Has DOCTOR Role
 * 
 * Verifies that the doctor_id corresponds to a user with the DOCTOR role.
 * This is a security check to prevent booking with non-doctors.
 * 
 * @param {string} doctorId - The doctor's doctor_id
 * @returns {boolean} True if user is a doctor, false otherwise
 */
exports.isDoctor = async (doctorId) => {
  const query = `
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = (
  SELECT user_id FROM doctors WHERE doctor_id = $1)
      AND r.role_name = 'DOCTOR'
  `;
  const { rowCount } = await pool.query(query, [doctorId]);
  return rowCount > 0;
};

/**
 * Check Doctor Availability for Time Slot
 * 
 * Checks if the doctor's availability schedule permits appointments
 * at the requested day and time. Uses the doctor_availability table.
 * 
 * @param {string} doctorId - The doctor's UUID
 * @param {number} dayOfWeek - Day of week (1=Mon, 7=Sun)
 * @param {string} startTime - Time in HH:MM:SS format
 * @param {string} endTime - Time in HH:MM:SS format
 * @returns {boolean} True if doctor is available, false otherwise
 */
exports.isDoctorAvailable = async (
  doctorId,
  dayOfWeek,
  startTime,
  endTime
) => {
  const query = `
    SELECT 1
    FROM doctor_availability
    WHERE doctor_id = $1
      AND day_of_week = $2
      AND $3 >= start_time
      AND $4 <= end_time
      AND is_active = TRUE
  `;
  const { rowCount } = await pool.query(query, [
    doctorId,
    dayOfWeek,
    startTime,
    endTime
  ]);
  return rowCount > 0;
};

// =============================================================================
// PATIENT-RELATED QUERIES
// =============================================================================

/**
 * Get All Appointments for a Patient
 * 
 * Fetches appointments for a patient, including doctor details.
 * 
 * @param {string} patientId - The patient's UUID
 * @returns {Array} Array of appointment records with doctor info
 */
exports.getAppointmentsForPatient = async (patientId) => {
  const query = `
    SELECT
      a.appointment_id,
      a.scheduled_start,
      a.scheduled_end,
      a.status,
      a.reason,
      d.full_name as doctor_name,
      d.specialization
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.doctor_id
    WHERE a.patient_id = $1
    ORDER BY a.scheduled_start ASC
  `;

  const { rows } = await pool.query(query, [patientId]);
  return rows;
};

/**
 * Get Patient ID from User ID
 * 
 * Resolves the patient_id for a logged-in user.
 * Patients have a separate record linked to their user account.
 * 
 * @param {string} userId - The user's UUID
 * @returns {Object|undefined} Object with patient_id, or undefined if no patient record
 */
exports.getPatientIdByUserId = async (userId) => {
  const query = `
    SELECT patient_id
    FROM patients
    WHERE user_id = $1
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

/**
 * Check if Patient Exists
 * 
 * Verifies that a patient record exists in the database.
 * 
 * @param {string} patientId - The patient's UUID
 * @returns {boolean} True if patient exists, false otherwise
 */
exports.patientExists = async (patientId) => {
  const query = `SELECT 1 FROM patients WHERE patient_id = $1`;
  const { rowCount } = await pool.query(query, [patientId]);
  return rowCount > 0;
};

// =============================================================================
// APPOINTMENT CREATION
// =============================================================================

/**
 * Insert New Appointment
 * 
 * Creates a new appointment record within a database transaction.
 * Uses a transaction client for atomic operations with audit logging.
 * 
 * The database has constraints to prevent double-booking (overlapping
 * appointments for the same doctor).
 * 
 * @param {Object} client - PostgreSQL transaction client
 * @param {Object} data - Appointment data
 * @param {string} data.patient_id - Patient's UUID
 * @param {string} data.doctor_id - Doctor's UUID
 * @param {string} data.scheduled_start - Start datetime
 * @param {string} data.scheduled_end - End datetime
 * @param {string} data.reason - Reason for appointment
 * @returns {string} The created appointment's UUID
 */
exports.insertAppointment = async (client, data) => {
  const query = `
    INSERT INTO appointments (
      patient_id,
      doctor_id,
      scheduled_start,
      scheduled_end,
      status,
      reason
    )
    VALUES ($1, $2, $3, $4, 'SCHEDULED', $5)
    RETURNING appointment_id
  `;

  const values = [
    data.patient_id,
    data.doctor_id,
    data.scheduled_start,
    data.scheduled_end,
    data.reason
  ];

  const { rows } = await client.query(query, values);
  return rows[0].appointment_id;
};

// =============================================================================
// AVAILABILITY MANAGEMENT
// =============================================================================

/**
 * Get Doctor User ID by Doctor ID
 * 
 * Helper to resolve doctor_id -> user_id for availability check
 */
exports.getDoctorUserIdByDoctorId = async (doctorId) => {
  const query = "SELECT user_id FROM doctors WHERE doctor_id = $1";
  const { rows } = await pool.query(query, [doctorId]);
  return rows[0];
};

/**
 * Upsert Doctor Availability
 * 
 * Updates or inserts availability for a specific day.
 * 
 * @param {string} doctorId - Doctor's UUID
 * @param {number} dayOfWeek - 1=Mon ... 7=Sun
 * @param {string} startTime - HH:MM:SS
 * @param {string} endTime - HH:MM:SS
 * @param {boolean} isActive - Whether this slot is active
 */
exports.upsertDoctorAvailability = async (doctorId, dayOfWeek, startTime, endTime, isActive) => {
  const query = `
    INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_active)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (doctor_id, day_of_week) 
    DO UPDATE SET 
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      is_active = EXCLUDED.is_active
  `;
  await pool.query(query, [doctorId, dayOfWeek, startTime, endTime, isActive]);
};

/**
 * Get Doctor Availability
 * 
 * Fetches current availability settings for a doctor.
 * 
 * @param {string} doctorId - Doctor's UUID
 * @returns {Array} List of availability records
 */
exports.getDoctorAvailability = async (doctorId) => {
  const query = `
    SELECT day_of_week, start_time, end_time, is_active 
    FROM doctor_availability 
    WHERE doctor_id = $1
    ORDER BY day_of_week ASC
  `;
  const { rows } = await pool.query(query, [doctorId]);
  return rows;
};

// =============================================================================
// HELPER QUERIES
// =============================================================================

/**
 * Get Doctor ID by User ID
 * 
 * @param {string} userId - User UUID
 * @returns {Object} { doctor_id }
 */
exports.getDoctorIdByUserId = async (userId) => {
  const query = `SELECT doctor_id FROM doctors WHERE user_id = $1`;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Insert Audit Log Entry
 * 
 * Records the appointment booking action in the audit log.
 * Part of the same transaction as appointment creation.
 * 
 * @param {Object} client - PostgreSQL transaction client
 * @param {string} actorUserId - User who booked the appointment
 * @param {string} appointmentId - The created appointment ID
 * @param {string} ip - IP address of the request
 */
exports.insertAuditLog = async (
  client,
  actorUserId,
  appointmentId,
  ip
) => {
  const query = `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id,
      ip_address
    )
    VALUES ($1, 'BOOK_APPOINTMENT', 'APPOINTMENT', $2, $3)
  `;

  await client.query(query, [actorUserId, appointmentId, ip]);
};

