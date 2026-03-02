"use strict";

const express = require("express");
const router = express.Router();

const labsController = require("./labs.controller");
const { authenticate } = require("../../middleware/auth.middleware");
const { authorize } = require("../../middleware/role.middleware");
const { logAudit } = require("../../utils/auditLogger");

const { attachLabPrivateKey, attachDoctorPrivateKey } = require("../../../src/middleware/labKey.middleware");

/* ======================================================
   1️⃣ DOCTOR ORDERS LAB TEST
   POST /labs/lab-orders
   ====================================================== */
router.post(
  "/lab-orders",
  authenticate,
  authorize("DOCTOR"),
  async (req, res) => {
    try {
      const { patient_id, test_id, test_name } = req.body;

      // Allow test_name OR test_id
      if (!patient_id || (!test_id && !test_name)) {
        return res.status(400).json({
          error: "patient_id and either test_id or test_name are required"
        });
      }

      const order = await labsController.createLabOrder(
        patient_id,
        test_id,
        req.user.user_id,
        test_name
      );

      await logAudit({
        actor_user_id: req.user.user_id,
        action: "ORDER_LAB_TEST",
        entity_type: "LAB_ORDER",
        entity_id: order.order_id
      });

      return res.status(201).json(order);
    } catch (err) {
      console.error("ORDER LAB TEST ERROR →", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/* ======================================================
   2️⃣ LAB TECH UPLOADS LAB REPORT
   POST /labs/reports
   ====================================================== */
router.post(
  "/reports",
  authenticate,
  authorize("LAB_TECH"),
  attachLabPrivateKey,
  async (req, res) => {
    try {
      console.log("📥 Uploading lab report. Body:", req.body);
      const { order_id, result_values } = req.body;

      if (!order_id || !result_values) {
        return res.status(400).json({
          error: "order_id and result_values are required"
        });
      }

      // 🔐 must be attached by middleware
      const labPrivateKey = req.labPrivateKey;
      console.log("🔑 Lab Private Key Present:", !!labPrivateKey);

      if (!labPrivateKey) {
        return res.status(500).json({
          error: "Lab private key not available"
        });
      }

      const result = await labsController.createLabReport(
        order_id,
        result_values,
        req.user.user_id,
        labPrivateKey
      );

      await logAudit({
        actor_user_id: req.user.user_id,
        action: "UPLOAD_LAB_REPORT",
        entity_type: "LAB_REPORT",
        entity_id: result.report_id
      });

      console.log("✅ Lab report uploaded successfully:", result.report_id);
      return res.status(201).json(result);
    } catch (err) {
      console.error("UPLOAD LAB REPORT ERROR →", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/* ======================================================
   3️⃣ DOCTOR VERIFIES LAB REPORT
   PATCH /labs/reports/:reportId/verify
   ====================================================== */
router.patch(
  "/reports/:reportId/verify",
  authenticate,
  authorize("DOCTOR"),
  attachDoctorPrivateKey,
  async (req, res) => {
    try {
      const { reportId } = req.params;

      // 🔐 must be attached by middleware
      const doctorPrivateKey = req.doctorPrivateKey;

      if (!doctorPrivateKey) {
        return res.status(500).json({
          error: "Doctor private key not available"
        });
      }

      const { diagnosis } = req.body;

      const result = await labsController.verifyLabReport(
        reportId,
        req.user.user_id,
        doctorPrivateKey,
        diagnosis
      );

      await logAudit({
        actor_user_id: req.user.user_id,
        action: "VERIFY_LAB_REPORT",
        entity_type: "LAB_REPORT",
        entity_id: reportId
      });

      return res.status(200).json(result);
    } catch (err) {
      console.error("VERIFY LAB REPORT ERROR →", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/* ======================================================
   5️⃣ PATIENT VIEWS OWN LAB REPORTS
   GET /labs/reports/patient
   ====================================================== */
router.get(
  "/my-reports",
  authenticate,
  authorize("PATIENT"),
  async (req, res) => {
    try {
      const reports = await labsController.getPatientLabReports(
        req.user.user_id
      );

      return res.status(200).json(reports);
    } catch (err) {
      console.error("PATIENT LAB REPORTS ERROR →", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/* ======================================================
   4️⃣ VIEW SINGLE LAB REPORT (SECURE)
   GET /labs/reports/:reportId
   ====================================================== */
router.get(
  "/reports/:reportId",
  authenticate,
  authorize(["DOCTOR", "PATIENT", "ADMIN"]),
  async (req, res) => {
    try {
      const report = await labsController.viewLabReport(
        req.params.reportId,
        req.user.user_id,
        req.user.role
      );

      return res.status(200).json(report);
    } catch (err) {
      return res.status(403).json({ error: err.message });
    }
  }
);



/* ======================================================
   6️⃣ DOCTOR VIEWS ASSIGNED LAB REPORTS
   GET /labs/doctor-reports
   ====================================================== */
router.get(
  "/doctor-reports",
  authenticate,
  authorize("DOCTOR"),
  async (req, res) => {
    try {
      const reports = await labsController.getDoctorLabReports(
        req.user.user_id
      );

      return res.status(200).json(reports);
    } catch (err) {
      console.error("DOCTOR LAB REPORTS ERROR →", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/* ======================================================
   7️⃣ GET AVAILABLE LAB TESTS
   GET /labs/tests
   (Accessible by Doctors for ordering)
   ====================================================== */
router.get(
  "/tests",
  authenticate,
  authorize("DOCTOR"),
  async (req, res) => {
    try {
      const tests = await labsController.getLabTests();
      return res.status(200).json(tests);
    } catch (err) {
      console.error("GET LAB TESTS ERROR →", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/* ======================================================
   8️⃣ GET PENDING ORDERS (LAB TECH)
   GET /labs/pending-orders
   ====================================================== */
router.get(
  "/pending-orders",
  authenticate,
  authorize("LAB_TECH"),
  async (req, res) => {
    try {
      const orders = await labsController.getPendingLabOrders();
      return res.status(200).json(orders);
    } catch (err) {
      console.error("GET PENDING ORDERS ERROR →", err);
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
