/**
 * Patient Controller
 * 
 * This controller handles HTTP request/response logic for patient management
 * operations. It delegates business logic to the patient service layer and
 * handles PII decryption for responses.
 * 
 * Security Note: Patient names are stored encrypted (PII protection) and
 * must be decrypted before sending to authorized users.
 * 
 * @module modules/patients/controller
 */

// Import service layer and utilities
const patientService = require("./patient.service");
const { decrypt } = require("../../utils/crypto.util");
const logAudit = require("../../utils/auditLogger");

// =============================================================================
// PATIENT CREATION
// =============================================================================

/**
 * Create Patient (without user account)
 * 
 * Handles POST /patients/
 * Creates a patient record that is not linked to a user account.
 * Used for manual data entry or legacy records.
 * 
 * Input:
 * - req.body.full_name: string (Required)
 * - req.body.dob: string (YYYY-MM-DD, Required)
 * - req.body.gender: string (Male/Female/Other, Required)
 * - req.body.blood_group: string (Optional)
 * 
 * Output:
 * - JSON object: Created patient record with decrypted name.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createPatient(req, res) {
  try {
    // Create patient via service layer
    const patient = await patientService.createPatient(req.body);

    // 🔐 AUDIT LOG - record who created this patient
    await logAudit({
      actorUserId: req.user.user_id,
      action: "CREATE_PATIENT",
      entityType: "PATIENT",
      entityId: patient.patient_id,
      ipAddress: req.ip
    });

    // 🔐 Decrypt name before sending response
    // PII is stored encrypted but must be readable in the response
    if (patient.full_name_encrypted) {
      patient.full_name_encrypted = decrypt(patient.full_name_encrypted);
    }

    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// =============================================================================
// PATIENT LISTING
// =============================================================================

/**
 * Get All Patients
 * 
 * Handles GET /patients/
 * Returns all active patients. Decrypts PII only for authorized roles.
 * 
 * Input:
 * - req.user.role: Used to determine if PII should be decrypted.
 * 
 * Output:
 * - JSON Array: List of patient objects.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAll(req, res) {
  try {
    // Fetch all patients from service layer
    const patients = await patientService.getAllPatients();

    // 🔐 AUDIT LOG - record bulk read access
    await logAudit({
      actorUserId: req.user.user_id,
      action: "VIEW_PATIENT",
      entityType: "PATIENT",
      entityId: null, // Multiple patients (bulk read)
      ipAddress: req.ip
    });

    // 🔐 Decrypt PII ONLY for authorized medical staff
    // This ensures patient data is protected but usable by care providers
    if (["ADMIN", "DOCTOR", "NURSE"].includes(req.user.role)) {
      patients.forEach(p => {
        if (p.full_name_encrypted) {
          p.full_name_encrypted = decrypt(p.full_name_encrypted);
        }
      });
    }

    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// =============================================================================
// PATIENT REGISTRATION (with user account)
// =============================================================================

/**
 * Register Patient with User Account
 * 
 * Handles POST /patients/register
 * Creates both a patient record and a linked user account.
 * This allows patients to log into the patient portal.
 * 
 * Input:
 * - req.body.username: string (Unique)
 * - req.body.password: string (Will be hashed)
 * - req.body.full_name: string
 * - req.body.dob: string
 * 
 * Output:
 * - JSON object: Created patient record.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerPatientWithUser(req, res) {
  try {
    // Create patient with linked user account
    const patient = await patientService.registerPatientWithUser(req.body);

    // 🔐 AUDIT LOG - record patient account creation
    await logAudit({
      actorUserId: req.user.user_id,
      action: "UPDATE_PATIENT",
      entityType: "PATIENT",
      entityId: patient.patient_id,
      ipAddress: req.ip
    });

    // 🔐 Decrypt before response
    if (patient.full_name_encrypted) {
      patient.full_name_encrypted = decrypt(patient.full_name_encrypted);
    }

    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createPatient,
  getAll,
  registerPatientWithUser
};
