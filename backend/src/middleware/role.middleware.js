/**
 * Role-Based Authorization Middleware
 * 
 * This middleware enforces role-based access control (RBAC) on protected routes.
 * It checks if the authenticated user's role is in the list of allowed roles
 * for the route. Unauthorized access attempts are logged to the audit trail.
 * 
 * Usage: Apply after authentication middleware
 * Example: router.post("/admin-only", authenticate, authorize("ADMIN"), handler);
 * 
 * Supported Roles: ADMIN, DOCTOR, NURSE, PATIENT, LAB_TECH
 * 
 * @module middleware/role
 */

"use strict";

// Import audit logging utility for security event tracking
const { logAudit } = require("../utils/auditLogger");

/**
 * Authorization Middleware Factory
 * 
 * Creates a middleware function that checks if the user's role is authorized
 * to access the route. Supports both single roles and arrays of roles.
 * 
 * @param {...string|Array} allowedRoles - Role(s) permitted to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Single role
 * authorize("ADMIN")
 * 
 * @example
 * // Multiple roles
 * authorize("DOCTOR", "NURSE")
 * 
 * @example
 * // Array of roles
 * authorize(["DOCTOR", "PATIENT"])
 */
module.exports.authorize = (...allowedRoles) => {

  // Flatten the array in case roles are passed as an array argument
  const roles = allowedRoles.flat();

  /**
   * Middleware function that performs the authorization check
   * 
   * @param {Object} req - Express request object (must have req.user from auth middleware)
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  return async (req, res, next) => {
    // ❌ Check if user or role is missing (shouldn't happen if auth middleware ran first)
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        error: "Role not found in token"
      });
    }

    // ❌ Check if user's role is NOT in the allowed roles list
    if (!roles.includes(req.user.role)) {
      // Log the unauthorized access attempt for security auditing
      await logAudit({
        actor_user_id: req.user.user_id,
        action: "PERMISSION_DENIED",
        entity_type: "SYSTEM",
        entity_id: null
      });

      return res.status(403).json({
        error: "Access denied"
      });
    }

    // ✅ User's role is authorized - proceed to the route handler
    next();
  };
};
