/**
 * Admin Audit Log Routes
 * 
 * This module provides API endpoints for administrators to view and monitor
 * audit logs. Audit logs track all security-relevant events in the system
 * including logins, permission denials, and data access.
 * 
 * All endpoints require ADMIN role for access.
 * 
 * @module routes/adminAuditRoutes
 */

"use strict";

// Express framework
const express = require("express");

// Database connection pool
const pool = require("../config/db");

// Authentication and authorization middleware
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// Create router instance
const router = express.Router();

// =============================================================================
// AUDIT LOG ENDPOINTS
// =============================================================================

/**
 * Get Full Audit Logs
 * GET /admin/audit-logs
 * 
 * Returns paginated audit log entries for security monitoring.
 * Supports limit/offset pagination.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN role required
 * 
 * @query {number} [limit=100] - Maximum number of logs to return
 * @query {number} [offset=0] - Number of logs to skip
 * 
 * @returns {Object} Response with:
 *   - count: Total number of audit logs
 *   - logs: Array of audit log entries
 */
router.get(
  "/audit-logs",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      // Extract pagination parameters with defaults
      const { limit = 100, offset = 0 } = req.query;

      // 1. Get total count for pagination metadata
      const countRes = await pool.query("SELECT COUNT(*) FROM audit_logs");
      const totalCount = parseInt(countRes.rows[0].count, 10);

      // 2. Fetch paginated logs, ordered by most recent first
      const result = await pool.query(
        `
        SELECT
          audit_id,
          actor_user_id,
          action,
          entity_type,
          entity_id,
          ip_address,
          created_at
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      );

      res.status(200).json({
        count: totalCount,
        logs: result.rows
      });
    } catch (err) {
      console.error("ADMIN GET AUDIT LOGS ERROR →", err);
      res.status(500).json({
        error: err.message   // Return error details during development
      });
    }
  }
);

/**
 * Get Audit Log Summary (Dashboard)
 * GET /admin/audit-logs/summary
 * 
 * Returns aggregated statistics for the admin dashboard.
 * Provides quick overview of system activity without fetching all logs.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN role required
 * 
 * @returns {Object} Summary statistics:
 *   - total_events: Total audit log entries
 *   - logins: Number of LOGIN events
 *   - denied: Number of PERMISSION_DENIED events
 *   - patient_access: Events involving PATIENT entity type
 *   - unique_users: Count of distinct users performing actions
 */
router.get(
  "/audit-logs/summary",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      // Aggregate query for dashboard statistics
      const result = await pool.query(`
        SELECT
          COUNT(*) AS total_events,
          COUNT(*) FILTER (WHERE action = 'LOGIN') AS logins,
          COUNT(*) FILTER (WHERE action = 'PERMISSION_DENIED') AS denied,
          COUNT(*) FILTER (WHERE entity_type = 'PATIENT') AS patient_access,
          COUNT(DISTINCT actor_user_id) AS unique_users
        FROM audit_logs
      `);

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error("AUDIT SUMMARY ERROR →", err);
      res.status(500).json({
        error: "Dashboard summary failed"
      });
    }
  }
);

module.exports = router;
