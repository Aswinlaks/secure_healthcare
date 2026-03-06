const repo = require('../../src/modules/vitals-intake/vitals-intake.repository');
const pool = require('../../src/config/db');

// Mock the database pool completely
jest.mock('../../src/config/db', () => ({
    query: jest.fn()
}));

describe('Vitals Intake Repository Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('insertVital', () => {
        it('should execute INSERT query with correct parameters', async () => {
            const mockData = {
                patient_id: '123e4567-e89b-12d3-a456-426614174000',
                heart_rate: 80,
                blood_pressure: '120/80',
                temperature: 37.5,
                spo2: 98
            };

            // Mock db query response
            const mockDbRow = { id: 1, ...mockData, created_at: new Date() };
            pool.query.mockResolvedValue({ rows: [mockDbRow] });

            const result = await repo.insertVital(mockData);

            // Verify query structure and param array
            expect(pool.query).toHaveBeenCalledTimes(1);

            const [queryStr, params] = pool.query.mock.calls[0];
            expect(queryStr).toContain('INSERT INTO vitals');
            expect(queryStr).toContain('RETURNING id');
            expect(params).toEqual([
                mockData.patient_id,
                mockData.heart_rate,
                mockData.blood_pressure,
                mockData.temperature,
                mockData.spo2
            ]);

            expect(result).toEqual(mockDbRow);
        });
    });

    describe('getVitalsByPatientId', () => {
        it('should execute SELECT query ordering by created desc', async () => {
            const patientId = '123e4567-e89b-12d3-a456-426614174000';
            const mockDbRows = [{ id: 1, heart_rate: 80 }, { id: 2, heart_rate: 82 }];

            pool.query.mockResolvedValue({ rows: mockDbRows });

            const result = await repo.getVitalsByPatientId(patientId);

            // Verify query structure and param array
            expect(pool.query).toHaveBeenCalledTimes(1);

            const [queryStr, params] = pool.query.mock.calls[0];
            expect(queryStr).toContain('SELECT id, patient_id, heart_rate');
            expect(queryStr).toContain('FROM vitals');
            expect(queryStr).toContain('WHERE patient_id = $1');
            expect(queryStr).toContain('ORDER BY created_at DESC');
            expect(params).toEqual([patientId]);

            expect(result).toEqual(mockDbRows);
        });
    });
});
