"use strict";

const pool = require("../../config/db");
const labsService = require("./labs.service");

/* ======================================================
   1️⃣ DOCTOR ORDERS LAB TEST
   ====================================================== */
/* ======================================================
   1️⃣ DOCTOR ORDERS LAB TEST
   ====================================================== */
exports.createLabOrder = async (patientId, testId, doctorId, testName) => {
  let finalTestId = testId;

  // If no testId but we have a name, find or create it
  if (!finalTestId && testName) {
    try {
      finalTestId = await labsService.findOrCreateTest(testName);
    } catch (err) {
      console.error("Failed to find/create test:", err);
      // Fallback: we can still insert the order without a test_id if we want, 
      // or fail. Since we added test_name column, we can rely on that.
      // But for now, let's assume finding/creating works or we log it.
    }
  }

  const { rows } = await pool.query(
    `
    INSERT INTO lab_orders
      (patient_id, doctor_id, test_id, test_name, status, ordered_at)
    VALUES ($1, $2, $3, $4, 'ORDERED', NOW())
    RETURNING *
    `,
    [patientId, doctorId, finalTestId, testName]
  );

  return rows[0];
};

/* ======================================================
   2️⃣ LAB TECH UPLOADS LAB REPORT
   ====================================================== */
exports.createLabReport = async (
  orderId,
  resultValues,
  labTechId,
  labPrivateKey
) => {
  return await labsService.createLabReport(
    orderId,
    resultValues,
    labTechId,
    labPrivateKey
  );
};

/* ======================================================
   3️⃣ DOCTOR VERIFIES LAB REPORT
   ====================================================== */
exports.verifyLabReport = async (
  reportId,
  doctorId,
  doctorPrivateKey,
  diagnosis
) => {
  return await labsService.verifyAndSignReport(
    reportId,
    doctorId,
    doctorPrivateKey,
    diagnosis
  );
};

/* ======================================================
   4️⃣ VIEW SINGLE LAB REPORT
   ====================================================== */
exports.viewLabReport = async (reportId, viewerUserId, viewerRole) => {
  return await labsService.viewLabReport(reportId, viewerUserId, viewerRole);
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
  return await labsService.getDoctorLabReports(doctorId);
};

/* ======================================================
   7️⃣ GET AVAILABLE LAB TESTS
   ====================================================== */
exports.getLabTests = async () => {
  return await labsService.getAllLabTests();
};

/* ======================================================
   8️⃣ GET PENDING LAB ORDERS
   ====================================================== */
exports.getPendingLabOrders = async () => {
  return await labsService.getPendingLabOrders();
};
