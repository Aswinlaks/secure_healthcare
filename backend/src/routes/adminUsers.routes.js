/**
 * Admin User Management Routes
 * 
 * This module provides API endpoints for administrators to manage users in
 * the system. Supports creating users with different roles, viewing all
 * users, and deleting users.
 * 
 * All endpoints require ADMIN role for access.
 * 
 * Supported Roles: ADMIN, DOCTOR, LAB_TECH, PATIENT
 * 
 * @module routes/adminUsers
 */

"use strict";

// Express framework
const express = require("express");
const router = express.Router();

// Password hashing
const bcrypt = require("bcryptjs");

// Database connection pool
const pool = require("../config/db");

// Encryption for PII (patient names)
const { encrypt } = require("../utils/encryption");

// Authentication and authorization middleware
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// =============================================================================
// USER CREATION
// =============================================================================

/**
 * Create New User
 * POST /admin/users
 * 
 * Creates a new user with specified role. If role is PATIENT,
 * also creates associated patient record.
 * 
 * Transaction Steps:
 * 1. Validate required fields
 * 2. Check username uniqueness
 * 3. Hash password
 * 4. Create user record
 * 5. Assign role
 * 6. Create domain record (patient only)
 * 7. Log audit event
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN role required
 * 
 * @body {string} username - Unique username
 * @body {string} password - User's password
 * @body {string} role - User role (ADMIN, DOCTOR, LAB_TECH, PATIENT)
 * @body {string} [full_name] - Required for PATIENT role
 * @body {string} [dob] - Required for PATIENT role
 * @body {string} [gender] - Required for PATIENT role
 * @body {string} [blood_group] - Required for PATIENT role
 */
router.post(
  "/users",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    // Get database transaction client for atomic operations
    const client = await pool.connect();

    try {
      const {
        username,
        email,
        password,

        role,
        full_name,
        dob,
        gender,
        blood_group,
        // Doctor specific fields
        specialization,
        qualification,
        experience_years,
        department,
        consultation_fee,
        phone_number
      } = req.body;

      // 🔴 Base validation - check required fields
      if (!username || !email || !password || !role) {
        return res.status(400).json({
          error: "username, email, password and role are required"
        });
      }

      // Normalize input (lowercase username, uppercase role)
      const normalizedUsername = username.trim().toLowerCase();
      const normalizedRole = role.trim().toUpperCase();

      // 🔴 Patient-specific validation
      if (normalizedRole === "PATIENT") {
        if (!full_name || !dob || !gender || !blood_group) {
          return res.status(400).json({
            error:
              "full_name, dob, gender, blood_group are required for patient"
          });
        }
      }

      // 🔴 Doctor-specific validation
      if (normalizedRole === "DOCTOR") {
        if (!full_name || !specialization || !department || !consultation_fee) {
          return res.status(400).json({
            error: "full_name, specialization, department, consultation_fee are required for doctor"
          });
        }
      }

      await client.query("BEGIN");

      // 1️⃣ Check if user already exists
      const existingUser = await client.query(
        "SELECT user_id FROM users WHERE username = $1",
        [normalizedUsername]
      );

      if (existingUser.rowCount > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({
          error: "Username already exists"
        });
      }

      // 2️⃣ Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      // 3️⃣ Create user record in users table
      const userResult = await client.query(
        `
        INSERT INTO users (
          username,
          email,
          password_hash,
          is_active,
          is_locked,
          created_at,
          mfa_enabled // Enforce MFA by default for all new users
        )
        VALUES ($1, $3, $2, TRUE, FALSE, NOW(), TRUE)
        RETURNING user_id
        `,
        [normalizedUsername, passwordHash, email]
      );

      const userId = userResult.rows[0].user_id;

      // 4️⃣ Resolve role_id from role name
      const roleResult = await client.query(
        "SELECT role_id FROM roles WHERE role_name = $1",
        [normalizedRole]
      );

      if (roleResult.rowCount === 0) {
        throw new Error("Invalid role");
      }

      const roleId = roleResult.rows[0].role_id;

      // 5️⃣ Assign role to user
      await client.query(
        `
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        `,
        [userId, roleId]
      );

      // 6️⃣ Create patient domain record (if PATIENT role)
      if (normalizedRole === "PATIENT") {
        await client.query(
          `
          INSERT INTO patients (
            user_id,
            full_name_encrypted,
            dob,
            gender,
            blood_group,
            medical_record_number,
            created_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            'MRN-' || FLOOR(RANDOM() * 1000000),
            NOW()
          )
          `,
          [
            userId,
            encrypt(full_name),  // 🔐 Encrypt PII
            dob,
            gender,
            blood_group
          ]
        );
      }

      // 6️⃣b Create doctor domain record (if DOCTOR role)
      if (normalizedRole === "DOCTOR") {
        await client.query(
          `
          INSERT INTO doctors (
            user_id,
            full_name,
            specialization,
            qualification,
            experience_years,
            department,
            consultation_fee,
            phone_number,
            is_active,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
          `,
          [
            userId,
            full_name,
            specialization,
            qualification,
            experience_years || 0,
            department,
            consultation_fee,
            phone_number
          ]
        );
      }

      // 7️⃣ Create audit log entry
      await client.query(
        `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id
        )
        VALUES ($1, 'USER_CREATED', 'USER', $2)
        `,
        [req.user.user_id || req.user.id, userId]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        message: "User created successfully",
        user_id: userId,
        role: normalizedRole
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("ADMIN CREATE USER ERROR →", err);
      return res.status(500).json({
        error: err.message
      });
    } finally {
      client.release();
    }
  }
);

// =============================================================================
// USER LISTING
// =============================================================================

/**
 * Get All Users
 * GET /admin/users
 * 
 * Returns a list of all users with their roles.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN role required
 * 
 * @returns {Array} List of users with user_id, username, is_active, created_at, role_name
 */
router.get(
  "/users",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      // Join users with roles through user_roles table
      const result = await pool.query(`
        SELECT
          u.user_id,
          u.username,
          u.is_active,
          u.created_at,
          r.role_name
        FROM users u
        JOIN user_roles ur ON u.user_id = ur.user_id
        JOIN roles r ON ur.role_id = r.role_id
        ORDER BY u.created_at DESC
      `);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error("ADMIN GET USERS ERROR →", err);
      res.status(500).json({
        error: "Failed to fetch users"
      });
    }
  }
);

// =============================================================================
// USER DELETION
// =============================================================================

/**
 * Delete User
 * DELETE /admin/users/:id
 * 
 * Deletes a user and their role assignments.
 * Note: Currently performs hard delete. Consider soft delete (is_active=false)
 * for production to preserve referential integrity.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN role required
 * 
 * @param {string} id - User UUID to delete (URL param)
 * 
 * @returns {Object} Success message
 * @throws {404} If user not found
 * @throws {400} If attempting to delete self
 */
router.delete(
  "/users/:id",
  authenticate,
  authorize("ADMIN"),
  async (req, res) => {
    const client = await pool.connect();
    const { id } = req.params;

    try {
      await client.query("BEGIN");

      // Check if user exists
      const userRes = await client.query(
        "SELECT user_id, username FROM users WHERE user_id = $1",
        [id]
      );

      if (userRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "User not found" });
      }

      // Prevent admin from deleting themselves
      if (req.user.user_id === id) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Cannot delete yourself" });
      }

      // Delete role assignments first (foreign key constraint)
      await client.query("DELETE FROM user_roles WHERE user_id = $1", [id]);

      // Delete the user
      // Note: Dependent records (patients, doctors) may need cascade handling
      await client.query("DELETE FROM users WHERE user_id = $1", [id]);

      // Create audit log entry
      await client.query(
        `
        INSERT INTO audit_logs (
          actor_user_id,
          action,
          entity_type,
          entity_id
        )
        VALUES ($1, 'USER_DELETED', 'USER', $2)
        `,
        [req.user.user_id, id]
      );

      await client.query("COMMIT");
      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("ADMIN DELETE USER ERROR ->", err);
      res.status(500).json({ error: "Failed to delete user" });
    } finally {
      client.release();
    }
  }
);

module.exports = router;
