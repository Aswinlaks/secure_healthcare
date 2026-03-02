/**
 * Doctors Repository
 * 
 * This repository layer handles all direct database operations for the
 * doctors module. It provides a clean abstraction over SQL queries.
 * 
 * @module modules/doctors/repository
 */

// Database connection pool
const pool = require("../../config/db");

// =============================================================================
// DATABASE QUERIES
// =============================================================================

/**
 * Get All Active Doctors
 * 
 * Retrieves all doctors where is_active = true, ordered alphabetically
 * by full name. Returns only essential fields for listing purposes.
 * 
 * @returns {Array} Array of doctor records with:
 *   - doctor_id: UUID for the doctor
 *   - full_name: Doctor's full name
 *   - specialization: Medical specialty (e.g., "Cardiology")
 */
exports.getAllDoctors = async () => {
  const query = `
    SELECT doctor_id, full_name, specialization
    FROM doctors
    WHERE is_active = true
    ORDER BY full_name ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};
