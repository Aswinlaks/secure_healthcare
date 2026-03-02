/**
 * Doctors Service
 * 
 * This service layer contains business logic for doctor-related operations.
 * Currently provides a simple delegation to the repository layer.
 * 
 * Future enhancements could include:
 * - Doctor search by specialization
 * - Availability filtering
 * - Rating/review aggregation
 * 
 * @module modules/doctors/service
 */

// Repository layer for database operations
const repo = require("./doctors.repository");

// =============================================================================
// SERVICE FUNCTIONS
// =============================================================================

/**
 * Get All Active Doctors
 * 
 * Retrieves all doctors marked as active in the system.
 * 
 * @returns {Array} Array of doctor objects with doctor_id, full_name, specialization
 */
exports.getAllDoctors = async () => {
    return await repo.getAllDoctors();
};
