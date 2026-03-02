const express = require('express');
const router = express.Router();
const aiBotController = require('./aiBot.controller');
const multer = require('multer');

/**
 * AI Bot Routes
 * Defines API endpoints for AI-powered clinical decision support
 */

// Configure Multer for file uploads (Memory storage is sufficient for small text files)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for text files
});

/**
 * @route POST /ai-bot/generate
 * @desc Generate an AI care and diet plan from a diagnosis file
 * @access Public (Simplified for this sprint based on auth design)
 */
router.post('/generate', upload.single('diagnosisFile'), aiBotController.generateInsights);

module.exports = router;
