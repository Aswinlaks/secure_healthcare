const { GoogleGenAI } = require('@google/genai');

/**
 * Configure providing the AI insights via Google Gemini.
 * It expects the GEMINI_API_KEY environment variable to be set.
 */

// We instantiate GoogleGenAI lazily to avoid throwing errors on app startup if the key isn't present yet,
// but rather throw when someone actually tries to use the AI Bot feature.
let ai = null;

const initAi = () => {
    if (!ai) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is missing.");
        }
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return ai;
};

/**
 * Call the configured LLM to generate a response based on the system prompt and user text.
 * 
 * @param {string} systemPrompt Instructions for the LLM
 * @param {string} userPrompt The actual input (e.g. diagnosis text)
 * @returns {Promise<string>} The raw text response from the LLM
 */
const callLLM = async (systemPrompt, userPrompt) => {
    try {
        const genai = initAi();
        // Use gemini-2.5-flash as the default fast and capable model
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                { role: "user", parts: [{ text: userPrompt }] }
            ],
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.2, // Low temperature for more deterministic, clinical output
                responseMimeType: "application/json", // Force JSON output
            }
        });

        return response.text;
    } catch (error) {
        console.error("LLM Provider Error:", error);
        throw new Error(`Failed to generate insights: ${error.message}`);
    }
};

module.exports = {
    callLLM
};
