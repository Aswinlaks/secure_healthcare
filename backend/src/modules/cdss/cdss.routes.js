/**
 * CDSS Routes
 * Defines API endpoints for clinical decision support
 */

const express = require('express');
const router = express.Router();
const controller = require('./cdss.controller');
const multer = require('multer');

// Configure Multer for file uploads (Memory storage is sufficient for small text files)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 } // 1MB limit
});

/**
 * @route POST /cdss/upload-lab-report
 * @desc Upload and parse a lab report file
 * @access Public (Simplified for this sprint)
 */
router.post('/upload-lab-report', upload.single('labReport'), controller.uploadLabReport);

/**
 * @route POST /cdss/generate-care-plan
 * @desc Generate care plan based on diagnosis
 * @access Public (Simplified for this sprint)
 */
router.post('/generate-care-plan', controller.generateCarePlan);

module.exports = router;
