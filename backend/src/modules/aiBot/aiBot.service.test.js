const aiBotService = require("./aiBot.service");
const { callLLM } = require("./llmProvider");

jest.mock("./llmProvider");

describe("aiBotService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should throw an error if the input diagnosis text is empty", async () => {
        await expect(aiBotService.generateInsights("")).rejects.toThrow("Diagnosis text is empty.");
        await expect(aiBotService.generateInsights("   ")).rejects.toThrow("Diagnosis text is empty.");
        await expect(aiBotService.generateInsights(null)).rejects.toThrow("Diagnosis text is empty.");
    });

    it("should successfully parse and return JSON from the LLM provider", async () => {
        const mockDiagnosis = "Patient has high blood pressure.";
        const mockResponse = {
            diagnosisSummary: "High blood pressure",
            carePlan: { monitoring: [], lifestyle: [], followUp: [] },
            dietPlan: { recommended: [], avoid: [], mealSuggestions: [] }
        };

        callLLM.mockResolvedValue(JSON.stringify(mockResponse));

        const result = await aiBotService.generateInsights(mockDiagnosis);

        expect(result).toEqual(mockResponse);
        expect(callLLM).toHaveBeenCalledTimes(1);
        expect(callLLM).toHaveBeenCalledWith(expect.any(String), mockDiagnosis);
    });

    it("should correctly strip markdown formatting from the LLM response before parsing", async () => {
        const mockDiagnosis = "Patient has a cold.";
        const mockResponse = {
            diagnosisSummary: "Common cold",
            carePlan: { monitoring: [], lifestyle: [], followUp: [] },
            dietPlan: { recommended: [], avoid: [], mealSuggestions: [] }
        };

        const markdownResponse = `\`\`\`json
${JSON.stringify(mockResponse)}
\`\`\``;

        callLLM.mockResolvedValue(markdownResponse);

        const result = await aiBotService.generateInsights(mockDiagnosis);

        expect(result).toEqual(mockResponse);
    });

    it("should throw an error if the LLM returns malformed JSON", async () => {
        const mockDiagnosis = "Patient has a cold.";
        const malformedResponse = `{ "diagnosisSummary": "Common cold", "carePlan": {`; // Invalid JSON

        callLLM.mockResolvedValue(malformedResponse);

        await expect(aiBotService.generateInsights(mockDiagnosis)).rejects.toThrow("The AI returned a malformed response that could not be parsed.");
    });

    it("should rethrow generic errors from callLLM wrapped in a custom message", async () => {
        const mockDiagnosis = "Patient has a cold.";
        const mockError = new Error("API rate limit exceeded");

        callLLM.mockRejectedValue(mockError);

        await expect(aiBotService.generateInsights(mockDiagnosis)).rejects.toThrow(mockError.message);
    });
});
