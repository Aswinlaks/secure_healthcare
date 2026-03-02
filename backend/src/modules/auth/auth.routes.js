/**
 * Authentication Routes
 * 
 * This module defines all authentication-related API endpoints including
 * login, registration, MFA verification, password management, and admin
 * user creation.
 * 
 * Authentication Flow:
 * 1. POST /login - Username/password check → sends OTP if MFA enabled
 * 2. POST /login/verify-otp - Verify OTP → returns JWT token
 * 3. POST /logout - Invalidate session (audit logged)
 * 
 * Registration Flow:
 * 1. POST /register - Patient self-registration → sends activation OTP
 * 2. POST /activate - Verify OTP → creates user account
 * 
 * Password Reset Flow:
 * 1. POST /forgot-password - Request reset → sends OTP
 * 2. POST /reset-password - Verify OTP + new password
 * 
 * @module modules/auth/routes
 */

const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");

// Import middleware for protected routes
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

/**
 * Step 1: Login with Username/Password
 * POST /auth/login
 * 
 * If MFA is enabled for the user, sends OTP to their email.
 * If MFA is disabled, returns JWT token directly.
 * 
 * @body {string} username - User's username or email
 * @body {string} password - User's password
 */
router.post("/login", controller.login);

/**
 * Public Registration (Patients Only)
 * POST /auth/register
 * 
 * Allows patients to self-register. Other roles (Doctor, Nurse, Lab Tech)
 * must be created by an admin. Sends OTP for account activation.
 * 
 * @body {string} email - User's email address
 * @body {string} password - Chosen password
 * @body {string} name - Full name
 * @body {string} role - Must be "PATIENT" for public registration
 * @body {string} dob - Date of birth
 * @body {string} gender - Gender
 * @body {string} blood_group - Blood group
 */
router.post("/register", controller.publicRegister);

/**
 * Step 2: Verify MFA OTP
 * POST /auth/login/verify-otp
 * 
 * Completes the login process by verifying the OTP sent to user's email.
 * Returns JWT token on success.
 * 
 * @body {string} username - User's username or email
 * @body {string} otp - 6-digit OTP from email
 */
router.post("/login/verify-otp", controller.verifyLoginOTP);

/**
 * Resend OTP
 * POST /auth/resend-otp
 * 
 * Generates and sends a new OTP for MFA verification.
 * 
 * @body {string} username - User's username or email
 */
router.post("/resend-otp", controller.resendOtp);

/**
 * Logout
 * POST /auth/logout
 * 
 * Logs the logout event in audit trail. Token invalidation should be
 * handled client-side (discard token).
 * 
 * @requires Authentication - Valid JWT token required
 */
router.post("/logout", authenticate, controller.logout);

/**
 * Forgot Password - Request Reset
 * POST /auth/forgot-password
 * 
 * Initiates password reset by sending OTP to user's email.
 * 
 * @body {string} email - User's registered email
 */
router.post("/forgot-password", controller.forgotPassword);

/**
 * Reset Password with OTP
 * POST /auth/reset-password
 * 
 * Completes password reset by verifying OTP and setting new password.
 * 
 * @body {string} email - User's email
 * @body {string} otp - OTP received via email
 * @body {string} newPassword - New password to set
 */
router.post("/reset-password", controller.resetPassword);

/**
 * Generate RSA Keys
 * POST /auth/generate-keys
 * 
 * Generates RSA key pair for digital signatures (lab techs, doctors).
 * Public key is stored in database, private key is returned (once only).
 * 
 * @requires Authentication - Valid JWT token required
 */
router.post("/generate-keys", authenticate, controller.generateKeys);

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

/**
 * Admin Create User
 * POST /auth/admin/create-user
 * 
 * Allows administrators to create new users (doctors, nurses, lab techs).
 * Sends activation OTP to the new user's email.
 * 
 * @requires Authentication - Valid JWT token required
 * @requires Authorization - ADMIN role required
 * 
 * @body {string} email - New user's email
 * @body {string} role - Role to assign (DOCTOR, NURSE, LAB_TECH, etc.)
 */
router.post(
  "/admin/create-user",
  authenticate,
  authorize(["ADMIN"]),
  controller.adminCreateUser
);

/**
 * Activate Account
 * POST /auth/activate
 * 
 * Activates a user account using OTP. For self-registered patients,
 * this completes registration. For admin-created users, this sets
 * their password.
 * 
 * @body {string} email - User's email
 * @body {string} otp - Activation OTP
 * @body {string} password - Password to set
 */
router.post("/activate", controller.activateAccount);

module.exports = router;
