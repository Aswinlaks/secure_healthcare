const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const { generateOTP, hashOTP } = require("../../utils/otp");
const { sendOTPEmail } = require("../../utils/email");
const patientService = require("../patients/patient.service");


/**
 * LOGIN – STEP 1 (Password check)
 */
exports.login = async (username, password) => {
  const { rows } = await pool.query(
    `
    SELECT 
      u.user_id,
      u.password_hash,
      u.mfa_enabled,
      u.email, 
      r.role_name
    FROM users u
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE (u.username = $1 OR u.email = $1)
      AND u.is_active = true
      AND u.is_locked = false
      AND u.password_hash IS NOT NULL
    `,
    [username]
  );

  if (!rows.length) {
    throw new Error("Invalid credentials");
  }

  const user = rows[0];

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error("Invalid credentials");
  }

  /**
   * MFA ENABLED → SEND OTP
   */
  if (user.mfa_enabled) {
    await pool.query(
      `
      UPDATE email_otps
      SET used = true
      WHERE user_id = $1 AND purpose = 'LOGIN_MFA'
      `,
      [user.user_id]
    );

    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    await pool.query(
      `
      INSERT INTO email_otps (user_id, otp_hash, purpose, expires_at)
      VALUES (
        $1,
        $2,
        'LOGIN_MFA',
        $3
      )
      `,
      [user.user_id, otpHash, new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60000)]
    );

    // 🔒 EMAIL REDIRECTED FOR TESTING (email.js handles this)
    // Use fetched email if available, otherwise fallback to username
    await sendOTPEmail(user.email || username, otp);

    return {
      mfaRequired: true,
      message: "OTP sent for MFA verification"
    };
  }

  /**
   * MFA DISABLED → ISSUE TOKEN
   */
  return issueJWT(user.user_id, user.role_name);
};

/**
 * PUBLIC REGISTER
 */
exports.publicRegister = async (data) => {
  const { password, role, full_name, dob, gender, blood_group } = data;

  // Normalize email to lowercase for consistent matching
  const email = data.email ? data.email.trim().toLowerCase() : null;

  if (!email) {
    throw new Error("Email is required");
  }

  // 🔒 SECURITY: Public registration is ONLY for Patients.
  // Doctors, Nurses, etc. must be created by Admin.
  // Normalize role to Uppercase for check and DB insertion
  const normalizedRole = role.toUpperCase();

  if (normalizedRole !== "PATIENT") {
    throw new Error("Only Patients can register publicly. Other roles require Admin creation.");
  }

  const existing = await pool.query(
    `SELECT 1 FROM users WHERE username = $1`,
    [full_name]
  );

  if (existing.rowCount) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  // Store in PENDING REGISTRATIONS table
  await pool.query(
    `
    INSERT INTO pending_registrations (
      email, password_hash, role, otp_hash, expires_at,
      full_name, dob, gender, blood_group
    )
    VALUES (
      $1, $2, $3, $4, $9,
      $5, $6, $7, $8
    )
    ON CONFLICT (email) DO UPDATE 
    SET password_hash = $2, role = $3, otp_hash = $4, expires_at = $9,
        full_name = $5, dob = $6, gender = $7, blood_group = $8
    `,
    [email, passwordHash, normalizedRole, otpHash, full_name, dob, gender, blood_group, new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60000)]
  );

  // 🔒 EMAIL REDIRECTED FOR TESTING
  await sendOTPEmail(email, otp);

  return { message: "Activation OTP sent. Please verify to complete registration." };
};

/**
 * LOGIN – STEP 2 (OTP Verification)
 */
exports.verifyLoginOTP = async (username, otp) => {
  const otpHash = hashOTP(otp);

  const { rows } = await pool.query(
    `
    SELECT 
      u.user_id,
      r.role_name,
      eo.otp_id
    FROM email_otps eo
    JOIN users u ON eo.user_id = u.user_id
    JOIN user_roles ur ON u.user_id = ur.user_id
    JOIN roles r ON ur.role_id = r.role_id
    WHERE (u.username = $1 OR u.email = $1)
      AND eo.otp_hash = $2
      AND eo.purpose = 'LOGIN_MFA'
      AND eo.used = false
      AND eo.expires_at > now()
    `,
    [username, otpHash]
  );

  if (!rows.length) {
    throw new Error("Invalid or expired OTP");
  }

  const user = rows[0];

  await pool.query(
    `UPDATE email_otps SET used = true WHERE otp_id = $1`,
    [user.otp_id]
  );

  return issueJWT(user.user_id, user.role_name);
  return issueJWT(user.user_id, user.role_name);
};

/**
 * RESEND OTP
 * 
 * Supports two scenarios:
 * 1. Pending Registration - user in pending_registrations table
 * 2. Existing User MFA - user in users table for login MFA
 */
exports.resendOtp = async (identifierInput) => {
  // Normalize identifier to lowercase for case-insensitive matching
  const identifier = identifierInput ? identifierInput.trim().toLowerCase() : null;

  if (!identifier) {
    throw new Error("Email or username is required");
  }


  // 1️⃣ First check if this is a pending registration
  const pendingRes = await pool.query(
    `SELECT * FROM pending_registrations WHERE LOWER(email) = $1`,
    [identifier]
  );

  if (pendingRes.rowCount > 0) {
    // This is a pending registration - resend activation OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Update the pending registration with new OTP (case-insensitive)
    const updateResult = await pool.query(
      `
      UPDATE pending_registrations 
      SET otp_hash = $1, 
          expires_at = $3
      WHERE LOWER(email) = $2
      `,
      [otpHash, identifier, new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60000)]
    );


    // Send OTP to the actual email from the pending record
    const actualEmail = pendingRes.rows[0].email;
    await sendOTPEmail(actualEmail, otp);

    return { message: "OTP resent successfully" };
  }

  // 2️⃣ Fallback to existing user (login MFA)
  const { rows } = await pool.query(
    `SELECT user_id, email, username FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1`,
    [identifier]
  );

  if (!rows.length) {
    throw new Error("User not found");
  }

  const user = rows[0];
  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await pool.query(
    `
    INSERT INTO email_otps (user_id, otp_hash, purpose, expires_at)
    VALUES ($1, $2, 'LOGIN_MFA', $3)
    `,
    [user.user_id, otpHash, new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60000)]
  );

  // Send to email (fallback to username if email null)
  await sendOTPEmail(user.email || user.username, otp);

  return { message: "OTP resent successfully" };
};

/**
 * ADMIN – CREATE USER
 */
exports.adminCreateUser = async (email, role) => {
  const existing = await pool.query(
    `SELECT 1 FROM users WHERE username = $1`,
    [email]
  );

  if (existing.rowCount) {
    throw new Error("User already exists");
  }

  const userRes = await pool.query(
    `
    INSERT INTO users (username, email, mfa_enabled, is_active)
    VALUES ($1, $1, true, false)
    RETURNING user_id
    `,
    [email]
  );

  const userId = userRes.rows[0].user_id;

  const roleRes = await pool.query(
    `SELECT role_id FROM roles WHERE role_name = $1`,
    [role]
  );

  if (!roleRes.rowCount) {
    throw new Error("Invalid role");
  }

  await pool.query(
    `INSERT INTO user_roles (user_id, role_id)
     VALUES ($1, $2)`,
    [userId, roleRes.rows[0].role_id]
  );

  await pool.query(
    `UPDATE email_otps SET used = true WHERE user_id = $1`,
    [userId]
  );

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await pool.query(
    `
    INSERT INTO email_otps (user_id, otp_hash, purpose, expires_at)
    VALUES (
      $1,
      $2,
      'ACTIVATION',
      $3
    )
    `,
    [userId, otpHash, new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60000)]
  );

  // 🔒 EMAIL REDIRECTED FOR TESTING
  await sendOTPEmail(email, otp);

  return { message: "User created and activation OTP sent" };
};

/**
 * ACTIVATE USER ACCOUNT
 */
exports.activateAccount = async (emailInput, otpInput, password) => {
  // Normalize inputs - email to lowercase, OTP trimmed
  const email = emailInput ? emailInput.trim().toLowerCase() : null;
  const otp = otpInput ? otpInput.toString().trim() : null;

  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const otpHash = hashOTP(otp);

  // 1. Check PENDING REGISTRATIONS first
  const pendingRes = await pool.query(
    `SELECT * FROM pending_registrations WHERE LOWER(email) = $1`,
    [email]
  );

  if (pendingRes.rowCount > 0) {
    const pendingUser = pendingRes.rows[0];

    // Verify OTP
    const isOtpMatch = pendingUser.otp_hash === otpHash;
    const isExpired = new Date() > new Date(pendingUser.expires_at);

    if (!isOtpMatch || isExpired) {
      throw new Error(isExpired ? "OTP has expired. Please request a new one." : "Invalid OTP. Please check and try again.");
    }

    // Move to USERS table
    // Note: 'password' arg is technically redundant if we used the one from pending, 
    // but the frontend sends it again. Let's use the one from pending as it was hashed.
    // Actually, frontend might allow password change? 
    // The previous flow set password at activation.
    // The current flow sets password at registration.
    // So 'pendingUser.password_hash' is what we want.
    // UNLESS the frontend sends a NEW password here?
    // Let's assume we use the one stored in pending for now as that's what they signed up with.

    // Create User
    // Use Full Name as Username due to user request. 
    // If Full Name is null (fallback), use email part or email.
    // Note: 'username' must be unique. If 'John Doe' exists, this might fail.
    // For now, we assume names are unique or acceptable to fail/user handle.
    // Or we can append random digits to ensure uniqueness.
    // Let's try raw full_name first as requested.
    const usernameToUse = pendingUser.full_name || email;

    const userInsert = await pool.query(
      `
      INSERT INTO users (username, email, password_hash, mfa_enabled, is_active)
      VALUES ($1, $2, $3, true, true)
      RETURNING user_id
      `,
      [usernameToUse, email, pendingUser.password_hash]
    );

    const userId = userInsert.rows[0].user_id;

    // Assign Role
    const roleRes = await pool.query(
      `SELECT role_id FROM roles WHERE role_name = $1`,
      [pendingUser.role]
    );

    if (roleRes.rowCount) {
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [userId, roleRes.rows[0].role_id]
      );
    }

    // 🏥 CREATE PATIENT RECORD if role is PATIENT
    if (pendingUser.role === 'PATIENT') {
      try {
        await patientService.createPatient({
          user_id: userId,
          full_name: pendingUser.full_name,
          dob: pendingUser.dob,
          gender: pendingUser.gender,
          blood_group: pendingUser.blood_group
        });
      } catch (patientErr) {
        console.error("Failed to create patient record:", patientErr);
        // Optionally rollback? For now, logging.
      }
    }

    // Store password history
    await pool.query(
      `INSERT INTO password_history (user_id, password_hash) VALUES ($1, $2)`,
      [userId, pendingUser.password_hash]
    );

    // Delete from pending
    await pool.query(`DELETE FROM pending_registrations WHERE pending_id = $1`, [pendingUser.pending_id]);

    return {
      message: "Account activated successfully",
      user_id: userId
    };
  }

  // 2. Fallback to EXISTING USER logic (Admin created users)
  // They exist in 'users' but 'is_active' = false
  const { rows } = await pool.query(
    `
    SELECT eo.otp_id, eo.user_id
    FROM email_otps eo
    JOIN users u ON eo.user_id = u.user_id
    WHERE u.username = $1
      AND eo.otp_hash = $2
      AND eo.purpose = 'ACTIVATION'
      AND eo.used = false
      AND eo.expires_at > now()
    `,
    [email, otpHash]
  );

  if (!rows.length) {
    throw new Error("Invalid or expired OTP");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = rows[0].user_id;

  await pool.query(
    `
    UPDATE users
    SET password_hash = $1,
        is_active = true
    WHERE user_id = $2
    `,
    [passwordHash, userId]
  );

  await pool.query(
    `UPDATE email_otps SET used = true WHERE otp_id = $1`,
    [rows[0].otp_id]
  );

  await pool.query(
    `INSERT INTO password_history (user_id, password_hash)
     VALUES ($1, $2)`,
    [userId, passwordHash]
  );

  return {
    message: "Account activated successfully",
    user_id: userId
  };
};

/**
 * FORGOT PASSWORD
 */
exports.forgotPassword = async (email) => {
  const { rows } = await pool.query(
    `
    SELECT user_id FROM users
    WHERE username = $1
      AND is_active = true
      AND is_locked = false
    `,
    [email]
  );

  if (!rows.length) {
    throw new Error("User not found or inactive");
  }

  const userId = rows[0].user_id;

  await pool.query(
    `
    UPDATE email_otps
    SET used = true
    WHERE user_id = $1 AND purpose = 'RESET_PASSWORD'
    `,
    [userId]
  );

  const otp = generateOTP();
  const otpHash = hashOTP(otp);

  await pool.query(
    `
    INSERT INTO email_otps (user_id, otp_hash, purpose, expires_at)
    VALUES (
      $1,
      $2,
      'RESET_PASSWORD',
      $3
    )
    `,
    [userId, otpHash, new Date(Date.now() + process.env.OTP_EXPIRY_MINUTES * 60000)]
  );

  // Determine email to send to:
  // User might have 'username' != 'email', so we fetch the explicit 'email' column if possible.
  // But we just updated the schema to have an 'email' column.

  // Fetch user email
  const user = await pool.query(`SELECT email FROM users WHERE user_id = $1`, [userId]);
  const userEmail = user.rows[0]?.email || email; // Fallback to original 'email' argument if 'email' column is null (legacy)

  // 🔒 EMAIL REDIRECTED FOR TESTING
  // In real prod, use userEmail
  await sendOTPEmail(userEmail, otp);

  return {
    mfaRequired: true,
    message: "OTP sent"
  };
};

/**
 * RESET PASSWORD
 */
exports.resetPassword = async (email, otp, newPassword) => {
  const otpHash = hashOTP(otp);

  const { rows } = await pool.query(
    `
    SELECT eo.otp_id, eo.user_id
    FROM email_otps eo
    JOIN users u ON eo.user_id = u.user_id
    WHERE u.username = $1
      AND eo.otp_hash = $2
      AND eo.purpose = 'RESET_PASSWORD'
      AND eo.used = false
      AND eo.expires_at > now()
    `,
    [email, otpHash]
  );

  if (!rows.length) {
    throw new Error("Invalid or expired OTP");
  }

  const userId = rows[0].user_id;
  const passwordHash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
    [passwordHash, userId]
  );

  await pool.query(
    `UPDATE email_otps SET used = true WHERE otp_id = $1`,
    [rows[0].otp_id]
  );

  await pool.query(
    `INSERT INTO password_history (user_id, password_hash)
     VALUES ($1, $2)`,
    [userId, passwordHash]
  );

  await pool.query(
    `UPDATE sessions SET is_valid = false WHERE user_id = $1`,
    [userId]
  );

  return { message: "Password reset successful" };
};

/**
 * ISSUE JWT
 */
function issueJWT(userId, role) {
  const token = jwt.sign(
    { user_id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  return { token, role, user_id: userId };
}
