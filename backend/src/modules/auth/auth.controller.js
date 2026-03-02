"use strict";

const authService = require("./auth.service");
const { logAudit } = require("../../utils/auditLogger");
const { generateRSAKeyPair } = require("../../utils/keypair");
const pool = require("../../config/db"); // ✅ FIXED PATH

/**
 * GENERATE RSA KEYS
 */
async function generateKeys(req, res) {
  try {
    const { publicKey, privateKey } = generateRSAKeyPair();

    await pool.query(
      `
      INSERT INTO user_public_keys (user_id, public_key_pem, key_type)
      VALUES ($1, $2, 'RSA')
      `,
      [req.user.user_id, publicKey]
    );

    return res.status(201).json({
      privateKey // shown only once
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * PUBLIC REGISTER
 */
async function publicRegister(req, res) {
  const { email, password, name, role, dob, gender, blood_group } = req.body;

  try {
    // We pass 'name' as 'full_name' to service
    await authService.publicRegister({
      email,
      password,
      role,
      full_name: name,
      dob,
      gender,
      blood_group
    });

    return res.status(201).json({
      message: "Registration successful. OTP sent."
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * LOGIN (STEP 1 – PASSWORD CHECK)
 */
async function login(req, res) {
  const { username, password } = req.body;

  try {
    const result = await authService.login(username, password);

    if (result.user_id) {
      await logAudit({
        actor_user_id: result.user_id,
        action: "LOGIN_PASSWORD_SUCCESS",
        entity_type: "USER",
        entity_id: result.user_id
      });
    }

    return res.status(200).json(result);

  } catch (err) {
    await logAudit({
      actor_user_id: null,
      action: "FAILED_LOGIN",
      entity_type: "SYSTEM",
      entity_id: null
    });

    return res.status(401).json({ error: err.message });
  }
}

/**
 * VERIFY LOGIN MFA OTP (STEP 2)
 */
async function verifyLoginOTP(req, res) {
  const { username, otp } = req.body;

  try {
    const result = await authService.verifyLoginOTP(username, otp);

    await logAudit({
      actor_user_id: result.user_id,
      action: "LOGIN_MFA_SUCCESS",
      entity_type: "USER",
      entity_id: result.user_id
    });

    return res.status(200).json(result);

  } catch (err) {
    await logAudit({
      actor_user_id: null,
      action: "LOGIN_MFA_FAILED",
      entity_type: "SYSTEM",
      entity_id: null
    });

    return res.status(401).json({ error: err.message });
  }
}

/**
 * RESEND OTP
 */
async function resendOtp(req, res) {
  const { username, email } = req.body;
  // Use username if present, else email (fallback/compatibility)
  const identifier = username || email;

  try {
    await authService.resendOtp(identifier);

    await logAudit({
      actor_user_id: null, // We might not know the ID yet securely, or could look it up.
      action: "RESEND_OTP",
      entity_type: "SYSTEM",
      entity_id: null
    });

    return res.status(200).json({ message: "OTP resent" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * LOGOUT
 */
async function logout(req, res) {
  try {
    await logAudit({
      actor_user_id: req.user.user_id,
      action: "LOGOUT",
      entity_type: "USER",
      entity_id: req.user.user_id
    });

    return res.status(200).json({
      message: "Logout successful"
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * ADMIN – CREATE USER
 */
async function adminCreateUser(req, res) {
  const { email, role } = req.body;

  try {
    await authService.adminCreateUser(email, role);

    await logAudit({
      actor_user_id: req.user.user_id,
      action: "ADMIN_CREATE_USER",
      entity_type: "SYSTEM",
      entity_id: null
    });

    return res.status(201).json({
      message: "User created. Activation OTP sent"
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * ACTIVATE ACCOUNT (OTP + SET PASSWORD)
 */
async function activateAccount(req, res) {
  const { email, otp, password } = req.body;

  try {
    // ✅ FIXED: service method name
    const result = await authService.activateAccount(email, otp, password);

    await logAudit({
      actor_user_id: result.user_id, // The user acting is the one activating
      action: "ACCOUNT_ACTIVATED",
      entity_type: "USER",
      entity_id: result.user_id      // The entity being modified is the user
    });

    return res.status(200).json({
      message: "Account activated successfully"
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * FORGOT PASSWORD
 */
async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    await authService.forgotPassword(email);

    await logAudit({
      actor_user_id: null,
      action: "FORGOT_PASSWORD_REQUEST",
      entity_type: "USER",
      entity_id: null
    });

    return res.status(200).json({
      message: "Password reset OTP sent"
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

/**
 * RESET PASSWORD
 */
async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;

  try {
    await authService.resetPassword(email, otp, newPassword);

    await logAudit({
      actor_user_id: null,
      action: "PASSWORD_RESET_SUCCESS",
      entity_type: "USER",
      entity_id: null
    });

    return res.status(200).json({
      message: "Password reset successful"
    });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  generateKeys,
  publicRegister,
  login,
  verifyLoginOTP,
  logout,
  adminCreateUser,
  activateAccount,
  forgotPassword,
  forgotPassword,
  resetPassword,
  resendOtp
};
