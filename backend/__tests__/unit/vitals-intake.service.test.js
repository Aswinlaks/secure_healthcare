const vitalsIntakeService = require('../../src/modules/vitals-intake/vitals-intake.service');
const repo = require('../../src/modules/vitals-intake/vitals-intake.repository');

// Mock the repository completely
jest.mock('../../src/modules/vitals-intake/vitals-intake.repository');

describe('Vitals Intake Service Unit Tests', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createVital', () => {
        it('should successfully validate and insert valid vitals data', async () => {
            const inputData = {
                patient_id: validUUID,
                heart_rate: '80', // String input
                blood_pressure: '120/80',
                temperature: '37.5', // String decimal input
                spo2: 98 // Number input
            };

            const expectedSanitizedData = {
                patient_id: validUUID,
                heart_rate: 80, // Should be cast to number
                blood_pressure: '120/80',
                temperature: 37.5, // Should be cast to number
                spo2: 98
            };

            const mockDbResult = { id: 1, ...expectedSanitizedData };
            repo.insertVital.mockResolvedValue(mockDbResult);

            const result = await vitalsIntakeService.createVital(inputData);

            expect(repo.insertVital).toHaveBeenCalledWith(expectedSanitizedData);
            expect(result).toEqual(mockDbResult);
        });

        it('should throw 400 if patient_id is not a valid UUID', async () => {
            const inputData = { patient_id: 'invalid-id' };

            await expect(vitalsIntakeService.createVital(inputData))
                .rejects.toThrow('patient_id must be a valid UUID');
        });

        it('should throw 400 if heart_rate is out of bounds', async () => {
            const inputData = { patient_id: validUUID, heart_rate: 400 };

            await expect(vitalsIntakeService.createVital(inputData))
                .rejects.toThrow('heart_rate must be an integer between 0 and 300');
        });

        it('should throw 400 if blood_pressure is not a string', async () => {
            const inputData = { patient_id: validUUID, blood_pressure: 12080 };

            await expect(vitalsIntakeService.createVital(inputData))
                .rejects.toThrow('blood_pressure must be a non-empty string');
        });

        it('should handle optional missing vitals correctly, setting them to null', async () => {
            const inputData = { patient_id: validUUID };

            const expectedSanitizedData = {
                patient_id: validUUID,
                heart_rate: null,
                blood_pressure: null,
                temperature: null,
                spo2: null
            };

            repo.insertVital.mockResolvedValue({ id: 2, ...expectedSanitizedData });

            await vitalsIntakeService.createVital(inputData);

            expect(repo.insertVital).toHaveBeenCalledWith(expectedSanitizedData);
        });
    });

    describe('getPatientVitals', () => {
        it('should successfully retrieve patient vitals history', async () => {
            const mockDbResult = [
                { id: 1, heart_rate: 80 },
                { id: 2, heart_rate: 82 }
            ];

            repo.getVitalsByPatientId.mockResolvedValue(mockDbResult);

            const result = await vitalsIntakeService.getPatientVitals(validUUID);

            expect(repo.getVitalsByPatientId).toHaveBeenCalledWith(validUUID);
            expect(result).toEqual({
                patient_id: validUUID,
                vitals: mockDbResult
            });
        });

        it('should throw 400 if patient_id is missing or invalid format', async () => {
            await expect(vitalsIntakeService.getPatientVitals('invalid-id'))
                .rejects.toThrow('patientId must be a valid UUID');

            expect(repo.getVitalsByPatientId).not.toHaveBeenCalled();
        });
    });
});
