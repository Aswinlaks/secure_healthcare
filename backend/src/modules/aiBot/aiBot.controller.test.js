const aiBotController = require("./aiBot.controller");
const aiBotService = require("./aiBot.service");

jest.mock("./aiBot.service");

describe("aiBotController", () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockReq = {
            file: null
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    it("should return 400 if no file is uploaded", async () => {
        await aiBotController.generateInsights(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: "No diagnosis file uploaded." });
        expect(aiBotService.generateInsights).not.toHaveBeenCalled();
    });

    it("should process a valid file, call aiBotService.generateInsights, and return 200 with the data", async () => {
        const mockFileContent = "Patient has seasonal allergies.";
        mockReq.file = {
            buffer: Buffer.from(mockFileContent, "utf-8")
        };

        const mockInsights = {
            diagnosisSummary: "Seasonal allergies",
            carePlan: { monitoring: [], lifestyle: [], followUp: [] },
            dietPlan: { recommended: [], avoid: [], mealSuggestions: [] }
        };

        aiBotService.generateInsights.mockResolvedValue(mockInsights);

        await aiBotController.generateInsights(mockReq, mockRes);

        expect(aiBotService.generateInsights).toHaveBeenCalledWith(mockFileContent);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockInsights });
    });

    it("should return 500 when aiBotService throws an error", async () => {
        const mockFileContent = "Patient has a minor injury.";
        mockReq.file = {
            buffer: Buffer.from(mockFileContent, "utf-8")
        };

        const mockError = new Error("Service unavailable");
        aiBotService.generateInsights.mockRejectedValue(mockError);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await aiBotController.generateInsights(mockReq, mockRes);

        expect(aiBotService.generateInsights).toHaveBeenCalledWith(mockFileContent);
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: mockError.message });

        consoleErrorSpy.mockRestore();
    });

    it("should return 500 with a default error message if error doesn't have a message", async () => {
        const mockFileContent = "Patient has a minor injury.";
        mockReq.file = {
            buffer: Buffer.from(mockFileContent, "utf-8")
        };

        const mockError = { customProperty: "something went wrong" }; // Not an Error object
        aiBotService.generateInsights.mockRejectedValue(mockError);

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        await aiBotController.generateInsights(mockReq, mockRes);

        expect(aiBotService.generateInsights).toHaveBeenCalledWith(mockFileContent);
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, error: 'An error occurred while generating AI insights.' });

        consoleErrorSpy.mockRestore();
    });
});
