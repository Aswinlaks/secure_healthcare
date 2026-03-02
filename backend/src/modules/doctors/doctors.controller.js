/**
 * Doctors Controller
 * 
 * This controller handles HTTP request/response logic for doctor-related
 * operations. It delegates business logic to the doctors service layer.
 * 
 * @module modules/doctors/controller
 */

// Import the service layer for business logic
const service = require("./doctors.service");

// =============================================================================
// ENDPOINTS
// =============================================================================

/**
 * Get All Active Doctors
 * 
 * Handles GET /doctors/
 * Returns a list of all active doctors in the system.
 * 
 * Used for:
 * - Populating doctor selection dropdowns
 * - Displaying available doctors for appointments
 * - Admin views showing doctor listings
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllDoctors = async (req, res) => {
    try {
        // Fetch all active doctors from service layer
        const doctors = await service.getAllDoctors();

        // Return the list of doctors
        res.json(doctors);
    } catch (err) {
        // Return 500 Internal Server Error with error message
        res.status(500).json({ error: err.message });
    }
};
