/**
 * Audit Logger Utility
 * 
 * This module provides centralized audit logging functionality for tracking
 * security-relevant events throughout the application. All significant actions
 * (login, logout, data access, permission denials) are logged for compliance
 * and security monitoring.
 * 
 * The audit logs are stored in the PostgreSQL audit_logs table and can be
 * reviewed by administrators through the admin dashboard.
 * 
 * @module utils/auditLogger
 */

// Database connection pool for executing audit log inserts
const pool = require("../config/db");

/**
 * Log an Audit Event
 * 
 * Records a security or compliance event in the audit_logs table.
 * 
 * @async
 * @param {Object} params - The audit log parameters
 * @param {string} params.actor_user_id - UUID of the user performing the action (can be null for system events)
 * @param {string} params.action - The action type (e.g., 'LOGIN_PASSWORD_SUCCESS', 'PERMISSION_DENIED', 'VERIFY_LAB_REPORT')
 * @param {string} params.entity_type - Type of entity being acted upon (e.g., 'USER', 'PATIENT', 'LAB_REPORT', 'SYSTEM')
 * @param {string|null} params.entity_id - UUID of the specific entity (null allowed only for SYSTEM entity_type)
 * 
 * @throws {Error} If entity_id is null for non-SYSTEM entity types
 * 
 * @example
 * // Log a successful login
 * await logAudit({
 *   actor_user_id: user.user_id,
 *   action: "LOGIN_PASSWORD_SUCCESS",
 *   entity_type: "USER",
 *   entity_id: user.user_id
 * });
 * 
 * @example
 * // Log a system event (no specific entity)
 * await logAudit({
 *   actor_user_id: null,
 *   action: "FAILED_LOGIN",
 *   entity_type: "SYSTEM",
 *   entity_id: null
 * });
 */
async function logAudit({
  actor_user_id,
  action,
  entity_type,
  entity_id
}) {
  // ✅ Validation: Allow NULL entity_id only for SYSTEM events
  // This ensures all non-system events have a traceable entity reference
  if (entity_type !== "SYSTEM" && !entity_id) {
    throw new Error("entity_id required for non-SYSTEM entity types");
  }

  // Insert the audit log entry into the database
  await pool.query(
    `
    INSERT INTO audit_logs (
      actor_user_id,
      action,
      entity_type,
      entity_id
    )
    VALUES ($1, $2, $3, $4)
    `,
    [actor_user_id, action, entity_type, entity_id]
  );
}

module.exports = { logAudit };
