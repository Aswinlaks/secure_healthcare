const vitalsIntakeController = require('../../src/modules/vitals-intake/vitals-intake.controller');
const vitalsIntakeService = require('../../src/modules/vitals-intake/vitals-intake.service');

// Mock the service layer completely
jest.mock('../../src/modules/vitals-intake/vitals-intake.service');

describe('Vitals Intake Controller Unit Tests', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Create mock request and response objects
        mockReq = {
            body: {},
            params: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('postVitals', () => {
        it('should return 201 and created vitals on success', async () => {
            const mockData = { patient_id: '123e4567-e89b-12d3-a456-426614174000', heart_rate: 80 };
            const mockResult = { id: 1, ...mockData, created_at: new Date() };

            mockReq.body = mockData;
            vitalsIntakeService.createVital.mockResolvedValue(mockResult);

            await vitalsIntakeController.postVitals(mockReq, mockRes);

            expect(vitalsIntakeService.createVital).toHaveBeenCalledWith(mockData);
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                message: "Vital signs recorded successfully",
                data: mockResult
            });
        });

        it('should return 400 when validation fails', async () => {
            const error = new Error('Validation failed');
            error.status = 400;

            vitalsIntakeService.createVital.mockRejectedValue(error);

            await vitalsIntakeController.postVitals(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Validation failed'
            });
        });

        it('should fallback to 500 when error has no status', async () => {
            const error = new Error('Database down');

            vitalsIntakeService.createVital.mockRejectedValue(error);

            await vitalsIntakeController.postVitals(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'Database down'
            });
        });
    });

    describe('getVitals', () => {
        const patientId = '123e4567-e89b-12d3-a456-426614174000';

        it('should return 200 and patient vitals history', async () => {
            mockReq.params.patientId = patientId;
            const mockResult = {
                patient_id: patientId,
                vitals: [{ id: 1, heart_rate: 75 }]
            };

            vitalsIntakeService.getPatientVitals.mockResolvedValue(mockResult);

            await vitalsIntakeController.getVitals(mockReq, mockRes);

            expect(vitalsIntakeService.getPatientVitals).toHaveBeenCalledWith(patientId);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult
            });
        });

        it('should return 400 for invalid patient ID via service rejection', async () => {
            mockReq.params.patientId = 'invalid-id';
            const error = new Error('patientId must be a valid UUID');
            error.status = 400;

            vitalsIntakeService.getPatientVitals.mockRejectedValue(error);

            await vitalsIntakeController.getVitals(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: 'patientId must be a valid UUID'
            });
        });
    });
});
