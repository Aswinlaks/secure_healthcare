const aiBotService = require('./aiBot.service');

/**
 * AI Bot Controller
 * 
 * Handles incoming API requests for AI-generated care and diet plans.
 */

/**
 * Generate AI Insights from a Diagnosis File
 * 
 * Expects a multipart/form-data request with a file field named `diagnosisFile`.
 * Extacts the text from the file and passes it to the AI service.
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.generateInsights = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No diagnosis file uploaded.' });
        }

        const fileContent = req.file.buffer.toString('utf-8');
        console.log(`Received diagnosis file for AI analysis (${fileContent.length} bytes)`);

        // Send to service for LLM processing
        const insights = await aiBotService.generateInsights(fileContent);

        return res.status(200).json({
            success: true,
            data: insights
        });

    } catch (err) {
        console.error("AI Bot Controller Error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || 'An error occurred while generating AI insights.'
        });
    }
};
