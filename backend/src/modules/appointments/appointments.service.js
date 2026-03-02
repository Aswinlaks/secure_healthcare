/**
 * Appointments Service
 * 
 * This service layer contains the business logic for appointment management.
 * It handles validation, doctor availability checks, conflict prevention,
 * and coordinates database operations through the repository layer.
 * 
 * Key Responsibilities:
 * - Validate appointment requests
 * - Check doctor availability windows
 * - Prevent double-booking conflicts
 * - Manage database transactions
 * - Decrypt patient data for doctor views
 * 
 * @module modules/appointments/service
 */

// Database connection pool for transactions
const pool = require("../../config/db");

// Repository layer for database operations
const repo = require("./appointments.repository");

// Encryption utility for decrypting patient names
const { decrypt } = require("../../utils/encryption");

// =============================================================================
// DOCTOR OPERATIONS
// =============================================================================

/**
 * Get Doctor's Appointments
 * 
 * Retrieves all appointments for a doctor and decrypts patient names.
 * Only doctors can access this function.
 * 
 * @param {Object} user - Authenticated user object from middleware
 * @param {string} user.user_id - Doctor's user ID
 * @param {string} user.role - Must be "DOCTOR"
 * @returns {Array} List of appointments with decrypted patient names
 * @throws {Error} 403 if user is not a doctor
 */
exports.getDoctorAppointments = async (user) => {
  // Role-based access control - must be a doctor
  if (user.role !== "DOCTOR") {
    const err = new Error("Only doctors can view their appointments");
    err.status = 403;
    throw err;
  }

  // Fetch appointments from database
  const appointments = await repo.getAppointmentsForDoctor(user.user_id);

  // Decrypt patient names before returning (PII is encrypted in database)
  return appointments.map(appt => ({
    ...appt,
    patient_name: appt.patient_name ? decrypt(appt.patient_name) : 'Unknown'
  }));
};

// =============================================================================
// PATIENT OPERATIONS
// =============================================================================

/**
 * Get Patient's Own Appointments
 * 
 * Retrieves all appointments for the logged-in patient.
 * Resolves patient_id from user_id since patients are linked to user accounts.
 * 
 * @param {Object} user - Authenticated user object from middleware
 * @param {string} user.user_id - Patient's user ID
 * @param {string} user.role - Must be "PATIENT"
 * @returns {Array} List of appointments with doctor information
 * @throws {Error} 403 if user is not a patient
 * @throws {Error} 404 if patient profile not found
 */
exports.getPatientAppointments = async (user) => {
  // Role-based access control - must be a patient
  if (user.role !== "PATIENT") {
    const err = new Error("Only patients can view their own appointments");
    err.status = 403;
    throw err;
  }

  // Resolve patient_id from user_id (patients table links to users)
  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found");
    err.status = 404;
    throw err;
  }

  return await repo.getAppointmentsForPatient(patient.patient_id);
};

// =============================================================================
// BOOKING OPERATIONS
// =============================================================================

/**
 * Book a New Appointment
 * 
 * Complete appointment booking logic including:
 * 1. Resolving patient_id from logged-in user
 * 2. Resolving doctor_id (by ID or name lookup)
 * 3. Validating doctor role
 * 4. Validating patient exists
 * 5. Checking appointment time validity
 * 6. Checking doctor availability
 * 7. Creating appointment in a transaction
 * 8. Recording audit log
 * 
 * @param {Object} data - Appointment request data
 * @param {string} [data.doctor_id] - Doctor's UUID (optional if doctor_name provided)
 * @param {string} [data.doctor_name] - Doctor's name for lookup
 * @param {string} data.scheduled_start - ISO datetime string
 * @param {string} data.scheduled_end - ISO datetime string
 * @param {string} data.reason - Appointment reason
 * @param {Object} user - Authenticated user from middleware
 * @returns {Object} Created appointment with ID, status, and success message
 * @throws {Error} Various validation errors with appropriate status codes
 */
exports.bookAppointment = async (data, user) => {
  const {
    doctor_id: inputDoctorId,
    doctor_name,
    scheduled_start,
    scheduled_end,
    reason
  } = data;

  // 🔐 Step 1: Resolve patient_id from logged-in user
  const patient = await repo.getPatientIdByUserId(user.user_id);
  if (!patient) {
    const err = new Error("Patient profile not found for this user");
    err.status = 404;
    throw err;
  }
  const patient_id = patient.patient_id;

  // 🔎 Step 2: Resolve doctor_id (either from input or by name lookup)
  let doctor_id = inputDoctorId;

  if (!doctor_id) {
    // Try to find doctor by name if ID not provided
    const doctor = await repo.getDoctorByName(doctor_name);
    if (!doctor) {
      const err = new Error("Doctor not found");
      err.status = 404;
      throw err;
    }
    doctor_id = doctor.doctor_id;
  }

  // 🩺 Step 3: Validate that the doctor is actually a doctor
  const isDoctor = await repo.isDoctor(doctor_id);
  if (!isDoctor) {
    const err = new Error("User is not a doctor");
    err.status = 400;
    throw err;
  }

  // 👤 Step 4: Validate patient exists (safety check)
  const patientExists = await repo.patientExists(patient_id);
  if (!patientExists) {
    const err = new Error("Patient not found");
    err.status = 404;
    throw err;
  }

  // ⏰ Step 5: Validate time range
  // ✅ Step 6: Convert JS day to Database day (0-6)
  const start = new Date(scheduled_start);
  const jsDay = start.getDay(); // JavaScript: 0=Sun, 1=Mon, ..., 6=Sat
  // The database constraint expects 0-6 (matching JS), so no conversion needed if 0=Sun.
  // Previous code mapped 0->7 which is wrong for the constraint.
  const dayOfWeek = jsDay;

  // Extract time portions for availability check
  const startTime = scheduled_start.slice(11, 19); // HH:MM:SS
  const endTime = scheduled_end.slice(11, 19);

  // 🧪 Debug logging for troubleshooting
  /* 
   * Schedule Logic:
   * Doctors add available slots (e.g., Monday 10:00-12:00).
   * Patients book appointments within these slots.
   */

  // Step 7: Check doctor availability for this time slot
  // Get the doctor's user_id because doctor_availability table uses user_id in doctor_id column
  const doctorUser = await repo.getDoctorUserIdByDoctorId(doctor_id);
  if (!doctorUser) {
    const err = new Error("Doctor user profile not found");
    err.status = 404;
    throw err;
  }

  const available = await repo.isDoctorAvailable(
    doctorUser.user_id,
    dayOfWeek,
    startTime,
    endTime
  );

  if (!available) {
    const err = new Error("Doctor not available at this time");
    err.status = 400;
    throw err;
  }

  // 🔁 Step 8: Create appointment in a database transaction
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert the appointment
    const appointmentId = await repo.insertAppointment(client, {
      patient_id,
      doctor_id,
      scheduled_start,
      scheduled_end,
      reason
    });

    // Record audit log for compliance
    await repo.insertAuditLog(
      client,
      user.user_id,
      appointmentId,
      "127.0.0.1" // TODO: Get actual IP from request
    );

    await client.query("COMMIT");

    return {
      appointment_id: appointmentId,
      status: "SCHEDULED",
      message: "Appointment booked successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");

    // Handle unique constraint violation (double-booking attempt)
    if (err.code === "23P01") {
      err.message = "Doctor already booked for this slot";
      err.status = 409; // Conflict
    }

    throw err;
  } finally {
    client.release();
  }
};

// =============================================================================
// AVAILABILITY MANAGEMENT
// =============================================================================

/**
 * Update Doctor Availability
 * 
 * Updates the availability schedule for a doctor.
 * 
 * @param {Object} user - Authenticated user object
 * @param {Array} availabilityData - List of { dayOfWeek, startTime, endTime, isActive }
 * @returns {Array} Updated availability
 */
exports.updateDoctorAvailability = async (user, availabilityData) => {
  // 1. Verify user is a doctor
  if (user.role !== "DOCTOR") {
    const err = new Error("Only doctors can manage availability");
    err.status = 403;
    throw err;
  }

  /* 
   * IMPORTANT SCHEMA NOTE:
   * The `doctor_availability` table has a column named `doctor_id`, BUT
   * the foreign key `fk_availability_doctor` actually points to `users.user_id`,
   * NOT `doctors.doctor_id`.
   * Confirmed by debug script src/scripts/debug_fk_robust.js.
   * 
   * Therefore, we must use `user.user_id` when inserting/querying this table.
   */
  const userId = user.user_id;

  // 3. Update each day
  for (const slot of availabilityData) {
    await repo.upsertDoctorAvailability(
      userId,
      slot.dayOfWeek,
      slot.startTime,
      slot.endTime,
      slot.isActive
    );
  }

  return await repo.getDoctorAvailability(userId);
};

/**
 * Get Own Availability
 * 
 * @param {Object} user - Authenticated doctor
 */
exports.getDoctorAvailability = async (user) => {
  if (user.role !== "DOCTOR") {
    const err = new Error("Access denied");
    err.status = 403;
    throw err;
  }

  // Use user_id as explained above
  return await repo.getDoctorAvailability(user.user_id);
};
