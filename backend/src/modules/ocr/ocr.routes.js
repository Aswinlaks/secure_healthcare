/**
 * OCR Routes
 *
 * Defines API endpoints for prescription image OCR operations.
 * Supports image upload, text extraction, AI integration,
 * and history retrieval.
 *
 * Auth: All routes require a valid JWT (authenticate).
 * Roles:
 *   - POST /ocr/upload-prescription            → DOCTOR, PATIENT
 *   - POST /ocr/generate-plan-from-prescription → DOCTOR, PATIENT
 *   - GET  /ocr/history                         → DOCTOR
 *   - GET  /ocr/:id                             → DOCTOR, PATIENT
 *
 * @module modules/ocr/routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const controller = require('./ocr.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');

// ============================================================================
// MULTER CONFIGURATION
// ============================================================================

// Use memory storage for image processing (no temp files)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max for high-res prescription images
    },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload an image file.`), false);
        }
    },
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route POST /ocr/upload-prescription
 * @desc Upload prescription image, run OCR, extract medications & diagnosis
 * @access DOCTOR, PATIENT
 * @body {File} prescriptionImage - Image file (JPEG, PNG, WebP, BMP, TIFF)
 * @returns {Object} OCR results with extracted medications and diagnosis codes
 */
router.post(
    '/upload-prescription',
    authenticate,
    authorize('DOCTOR', 'PATIENT'),
    upload.single('prescriptionImage'),
    controller.uploadPrescription
);

/**
 * @route POST /ocr/generate-plan-from-prescription
 * @desc Generate care plan from OCR-extracted prescription data via CDSS AI
 * @access DOCTOR, PATIENT
 * @body {string} diagnosisCode - ICD-10 diagnosis code
 * @body {string} [patientId]   - Optional patient ID
 * @body {string} [patientName] - Optional patient name
 * @body {Array}  [medications] - Extracted medications array
 */
router.post(
    '/generate-plan-from-prescription',
    authenticate,
    authorize('DOCTOR', 'PATIENT'),
    controller.generatePlanFromPrescription
);

/**
 * @route GET /ocr/history
 * @desc Get recent OCR extraction history
 * @access DOCTOR only
 */
router.get(
    '/history',
    authenticate,
    authorize('DOCTOR'),
    controller.getHistory
);

/**
 * @route GET /ocr/:id
 * @desc Get a specific OCR result by ID
 * @access DOCTOR, PATIENT
 */
router.get(
    '/:id',
    authenticate,
    authorize('DOCTOR', 'PATIENT'),
    controller.getById
);

module.exports = router;
