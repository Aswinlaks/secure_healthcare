"use strict";

const pool = require("../../config/db");

const { encrypt, decrypt } = require("../../utils/encryption");
const {
  hashData,
  signHash,
  verifySignature
} = require("../../utils/digitalSignature");
const { logAudit } = require("../../utils/auditLogger");

/* ======================================================
   1️⃣ LAB TECH CREATES LAB REPORT
   (Doctor must have ordered test first)
   ====================================================== */
exports.createLabReport = async (
  orderId,
  resultValues,
  labTechId,
  labPrivateKey
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔎 Ensure lab order exists & is ORDERED
    const orderRes = await client.query(
      `
      SELECT status
      FROM lab_orders
      WHERE order_id = $1
      `,
      [orderId]
    );

    if (orderRes.rowCount === 0) {
      throw new Error("Lab order not found");
    }

    if (orderRes.rows[0].status !== "ORDERED") {
      throw new Error("Lab report already uploaded or invalid state");
    }

    // 1️⃣ Encrypt result (ALWAYS stringify)
    const encryptedString = encrypt(JSON.stringify(resultValues));

    // 2️⃣ Hash encrypted result
    const reportHash = hashData(encryptedString);

    // 3️⃣ Lab technician signs hash
    const labSignature = signHash(reportHash, labPrivateKey);

    // 4️⃣ Store lab report
    // Store encrypted string directly (column is TEXT)
    const reportRes = await client.query(
      `
      INSERT INTO lab_reports (
        order_id,
        result_values,
        report_hash,
        lab_tech_signature,
        lab_tech_signed_at,
        verified
      )
      VALUES ($1, $2, $3, $4, NOW(), false)
      RETURNING report_id
      `,
      [orderId, encryptedString, reportHash, labSignature]
    );

    // 5️⃣ Update lab order
    await client.query(
      `
      UPDATE lab_orders
      SET status = 'COMPLETED',
          lab_tech_id = $1
      WHERE order_id = $2
      `,
      [labTechId, orderId]
    );

    await client.query("COMMIT");

    return {
      report_id: reportRes.rows[0].report_id,
      message: "Lab report uploaded successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ======================================================
   2️⃣ DOCTOR VERIFIES & SIGNS LAB REPORT
   ====================================================== */
exports.verifyAndSignReport = async (
  reportId,
  doctorId,
  doctorPrivateKey,
  diagnosis
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Fetch report + lab tech public key
    const { rows } = await client.query(
      `
      SELECT 
        lr.report_hash,
        lr.lab_tech_signature,
        lo.lab_tech_id,
        lr.lab_tech_signature,
        lo.lab_tech_id,
        lo.doctor_id,
        lr.verified,
        upk.public_key_pem AS lab_public_key
      FROM lab_reports lr
      JOIN lab_orders lo ON lr.order_id = lo.order_id
      JOIN user_public_keys upk ON upk.user_id = lo.lab_tech_id
      WHERE lr.report_id = $1
      `,
      [reportId]
    );

    if (!rows.length) {
      throw new Error("Lab report not found");
    }

    const report = rows[0];

    // ✅ If already verified, return success immediately
    if (report.verified) {
      return { message: "Lab report is already verified" };
    }

    // Check if the verifying doctor is the one who ordered the test
    if (report.doctor_id !== doctorId) {
      throw new Error("Unauthorized: You can only verify reports for your own patients");
    }

    // 2️⃣ Verify lab technician signature
    const labValid = verifySignature(
      report.report_hash,
      report.lab_tech_signature.toString(),
      report.lab_public_key
    );

    if (!labValid) {
      throw new Error("Lab technician signature verification failed");
    }

    // 3️⃣ Doctor signs same hash
    const doctorSignature = signHash(
      report.report_hash,
      doctorPrivateKey
    );

    // 4️⃣ Mark report verified
    await client.query(
      `
      UPDATE lab_reports
      SET doctor_signature = $1,
          verified = true,
          verified_at = NOW(),
          verified_by = $2,
          diagnosis = $4
      WHERE report_id = $3
      `,
      [doctorSignature, doctorId, reportId, diagnosis ? encrypt(diagnosis) : null]
    );

    // 5️⃣ Audit Log
    await logAudit({
      actor_user_id: doctorId,
      action: "VERIFY_LAB_REPORT",
      entity_type: "LAB_REPORT",
      entity_id: reportId
    });

    await client.query("COMMIT");

    return {
      message: "Lab report verified successfully"
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ======================================================
   3️⃣ VIEW LAB REPORT (WITH SIGNATURE VERIFICATION)
   ====================================================== */

exports.viewLabReport = async (reportId, viewerUserId, viewerRole) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Fetch report + public keys + test_name
    const { rows } = await client.query(
      `
      SELECT 
        lr.report_id,
        lr.result_values,
        lr.report_hash,
        lr.lab_tech_signature,
        lr.doctor_signature,
        lr.diagnosis,

        lr.verified,
        lr.verified_at,

        lo.doctor_id,
        lo.ordered_at,
        p.user_id AS patient_user_id,
        lo.patient_id,
        COALESCE(lo.test_name, ltc.test_name) as test_name,
        lab_key.public_key_pem AS lab_public_key,
        doc_key.public_key_pem AS doctor_public_key
      FROM lab_reports lr
      JOIN lab_orders lo ON lr.order_id = lo.order_id
      JOIN patients p ON lo.patient_id = p.patient_id
      LEFT JOIN lab_test_catalog ltc ON ltc.test_id = lo.test_id
      JOIN user_public_keys lab_key ON lab_key.user_id = lo.lab_tech_id
      LEFT JOIN user_public_keys doc_key ON doc_key.user_id = lr.verified_by
      WHERE lr.report_id = $1
      `,
      [reportId]
    );

    if (!rows.length) {
      throw new Error("Lab report not found");
    }

    const report = rows[0];

    // 🔒 ACCESS CONTROL
    if (viewerRole === "PATIENT") {
      if (report.patient_user_id !== viewerUserId) {
        throw new Error("Unauthorized: You can only view your own lab reports");
      }
    } else if (viewerRole === "DOCTOR") {
      if (report.doctor_id !== viewerUserId) {
        throw new Error("Unauthorized: You can only view reports for your assigned patients");
      }
    }

    // 2️⃣ Verify integrity (hash encrypted data)
    // The result_values is now directly the encrypted string (TEXT)
    let cipherText = report.result_values;

    // Check integrity of raw value
    let recalculatedHash = hashData(cipherText);

    // BACKWARD COMPATIBILITY FIX:
    // Some reports were stored as JSON stringified objects {"cipher": "..."}
    // But the hash was calculated on the inner "...".
    // We detect this case and unwrap it.
    if (recalculatedHash !== report.report_hash) {
      if (cipherText.trim().startsWith('{"cipher":')) {
        try {
          const parsed = JSON.parse(cipherText);
          if (parsed.cipher) {
            const innerHash = hashData(parsed.cipher);
            if (innerHash === report.report_hash) {
              // Integrity PASSES on inner text
              cipherText = parsed.cipher;
              recalculatedHash = innerHash; // Update so downstream checks pass if needed
            }
          }
        } catch (e) {
          // Parse error, ignore and fall through to failure
        }
      }
    }

    if (recalculatedHash !== report.report_hash) {
      throw new Error("Report integrity check failed");
    }

    // 3️⃣ Verify lab technician signature
    if (!report.lab_public_key) {
      // Fallback or warning? For now, we cant verify without key.
      // But throwing error prevents viewing. Maybe we should allow viewing but mark unverified?
      // Requirement says strict verification.
      throw new Error("Lab technician public key not found. Cannot verify report signature.");
    }

    const labValid = verifySignature(
      report.report_hash,
      report.lab_tech_signature.toString(),
      report.lab_public_key
    );

    if (!labValid) {
      throw new Error("Invalid lab technician signature");
    }

    // 4️⃣ Verify doctor signature (if verified)
    if (report.verified) {
      if (!report.doctor_public_key) {
        // CRITICAL FIX: If doctor key is missing, don't crash.
        // We'll throw specific error so we know why it failed.
        throw new Error("Doctor public key not found. Cannot verify doctor signature.");
      }

      const doctorValid = verifySignature(
        report.report_hash,
        report.doctor_signature.toString(),
        report.doctor_public_key
      );

      if (!doctorValid) {
        throw new Error("Invalid doctor signature");
      }
    }

    // 5️⃣ Decrypt AFTER verification
    let decryptedResult;
    try {
      decryptedResult = JSON.parse(
        decrypt(cipherText)
      );
    } catch (err) {
      console.error("Decryption error:", err);
      throw new Error("Decryption failed: The report data appears to be corrupted or encrypted with an old key.");
    }

    // 6️⃣ Log PHI access
    await client.query(
      `
      INSERT INTO phi_access_logs (user_id, patient_id, access_type)
      VALUES ($1, $2, 'LAB_REPORT_VIEW')
      `,
      [viewerUserId, report.patient_id]
    );

    await client.query("COMMIT");

    return {
      report_id: report.report_id,
      verified: report.verified,
      verified_at: report.verified_at,
      ordered_at: report.ordered_at,
      test_name: report.test_name,
      result: decryptedResult,
      diagnosis: report.diagnosis ? decrypt(report.diagnosis) : null
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ======================================================
   5️⃣ PATIENT VIEWS OWN VERIFIED LAB REPORTS
   ====================================================== */
exports.getPatientLabReports = async (userId) => {
  // Resolve patient_id from user_id
  const patientRes = await pool.query(
    `SELECT patient_id FROM patients WHERE user_id = $1`,
    [userId]
  );

  if (patientRes.rowCount === 0) {
    throw new Error("Patient record not found");
  }

  const patientId = patientRes.rows[0].patient_id;

  const { rows } = await pool.query(
    `
    SELECT
      lr.report_id,
      lr.verified,
      lr.verified_at,
      lo.ordered_at,
      COALESCE(lo.test_name, ltc.test_name) as test_name
    FROM lab_reports lr
    JOIN lab_orders lo ON lo.order_id = lr.order_id
    LEFT JOIN lab_test_catalog ltc ON ltc.test_id = lo.test_id
    WHERE lo.patient_id = $1
      AND lr.verified = true
    ORDER BY lr.created_at DESC
    `,
    [patientId]
  );

  return rows;
};

/* ======================================================
   6️⃣ DOCTOR VIEWS ASSIGNED LAB REPORTS
   ====================================================== */
exports.getDoctorLabReports = async (doctorId) => {
  const { rows } = await pool.query(
    `
    SELECT
      lr.report_id,
      lr.verified,
      lr.verified_at,
      lo.ordered_at,
      COALESCE(lo.test_name, ltc.test_name) as test_name,
      p.full_name_encrypted AS patient_name_encrypted,
      lo.patient_id
    FROM lab_reports lr
    JOIN lab_orders lo ON lo.order_id = lr.order_id
    LEFT JOIN lab_test_catalog ltc ON ltc.test_id = lo.test_id
    JOIN patients p ON p.patient_id = lo.patient_id
    WHERE lo.doctor_id = $1
    ORDER BY lr.created_at DESC
    `,
    [doctorId]
  );

  return rows;
};

/* ======================================================
   7️⃣ GET AVAILABLE LAB TESTS
   ====================================================== */
exports.getAllLabTests = async () => {
  // Only select columns that actually exist
  const { rows } = await pool.query(
    `SELECT test_id, test_name, test_code FROM lab_test_catalog ORDER BY test_name`
  );
  return rows;
};

/* ======================================================
   8️⃣ FIND OR CREATE TEST (Helper)
   ====================================================== */
exports.findOrCreateTest = async (testName) => {
  // Normalize name
  const name = testName.trim();

  // Check existence
  const existing = await pool.query(
    `SELECT test_id FROM lab_test_catalog WHERE LOWER(test_name) = LOWER($1)`,
    [name]
  );

  if (existing.rowCount > 0) {
    return existing.rows[0].test_id;
  }

  // Create new
  // Create a code from name (e.g. "Vitamin D" -> "VITAMIN_D")
  const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 50);

  const newItem = await pool.query(
    `INSERT INTO lab_test_catalog (test_name, test_code) VALUES ($1, $2) RETURNING test_id`,
    [name, code]
  );

  return newItem.rows[0].test_id;
};

/* ======================================================
   9️⃣ LAB TECH GETS PENDING ORDERS
   ====================================================== */
exports.getPendingLabOrders = async () => {
  const { rows } = await pool.query(
    `
    SELECT
      lo.order_id,
      lo.ordered_at,
      COALESCE(lo.test_name, ltc.test_name) as test_name,
      lo.status,
      lo.patient_id,
      p.full_name_encrypted AS patient_name_encrypted,
      lo.doctor_id
    FROM lab_orders lo
    LEFT JOIN lab_test_catalog ltc ON ltc.test_id = lo.test_id
    JOIN patients p ON p.patient_id = lo.patient_id
    WHERE lo.status = 'ORDERED'
    ORDER BY lo.ordered_at ASC
    `
  );

  return rows;
};
