/**
 * OCR Controller Unit Tests
 *
 * Tests the HTTP request/response handling in ocr.controller.js.
 * Mocks the OCR service and database to isolate controller logic.
 */

// Mock the OCR service
jest.mock('../../src/modules/ocr/ocr.service', () => ({
    processPrescriptionImage: jest.fn(),
    extractTextFromImage: jest.fn(),
    cleanPrescriptionText: jest.fn(),
    extractMedications: jest.fn(),
    extractDiagnosisCodes: jest.fn(),
    extractPatientInfo: jest.fn(),
}));

// Mock the database pool
jest.mock('../../src/config/db', () => ({
    query: jest.fn(),
    connect: jest.fn(),
}));

// Mock the CDSS module
jest.mock('../../src/modules/cdss/clinicalKnowledgeGraph', () => {
    return jest.fn().mockImplementation(() => ({
        evaluate: jest.fn().mockReturnValue({
            carePlan: { description: 'Test care plan' },
            alerts: [],
        }),
    }));
});

const controller = require('../../src/modules/ocr/ocr.controller');
const ocrService = require('../../src/modules/ocr/ocr.service');
const pool = require('../../src/config/db');

// Helper to create mock req/res
const mockReq = (overrides = {}) => ({
    file: null,
    body: {},
    params: {},
    user: { user_id: 'test-user-id', role: 'DOCTOR' },
    ...overrides,
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// =============================================================================
// uploadPrescription
// =============================================================================

describe('uploadPrescription', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 400 if no file is uploaded', async () => {
        const req = mockReq({ file: null });
        const res = mockRes();

        await controller.uploadPrescription(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.any(String) })
        );
    });

    test('should return 200 with OCR results on successful upload', async () => {
        const mockResult = {
            rawText: 'Metformin 500mg',
            confidence: 85,
            cleanedText: 'Metformin 500mg',
            medications: [{ name: 'Metformin', dosage: '500mg' }],
            diagnosisCodes: ['E11'],
            patientInfo: { name: 'John' },
        };

        ocrService.processPrescriptionImage.mockResolvedValue(mockResult);
        pool.query.mockResolvedValue({ rows: [{ id: 'test-id' }] });

        const req = mockReq({
            file: {
                buffer: Buffer.from('fake-image'),
                mimetype: 'image/png',
                originalname: 'test.png',
            },
        });
        const res = mockRes();

        await controller.uploadPrescription(req, res);

        expect(ocrService.processPrescriptionImage).toHaveBeenCalledWith(
            expect.any(Buffer),
            'image/png'
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                rawText: 'Metformin 500mg',
                medications: expect.any(Array),
            })
        );
    });

    test('should return 500 when OCR service throws an error', async () => {
        ocrService.processPrescriptionImage.mockRejectedValue(
            new Error('Tesseract failed')
        );

        const req = mockReq({
            file: {
                buffer: Buffer.from('bad-image'),
                mimetype: 'image/png',
                originalname: 'bad.png',
            },
        });
        const res = mockRes();

        await controller.uploadPrescription(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.any(String) })
        );
    });
});

// =============================================================================
// generatePlanFromPrescription
// =============================================================================

describe('generatePlanFromPrescription', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 400 if no diagnosisCode is provided', async () => {
        const req = mockReq({ body: {} });
        const res = mockRes();

        await controller.generatePlanFromPrescription(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should return 200 with care plan for valid diagnosis code', async () => {
        const req = mockReq({
            body: {
                diagnosisCode: 'E11',
                medications: [{ name: 'Metformin', dosage: '500mg' }],
            },
        });
        const res = mockRes();

        await controller.generatePlanFromPrescription(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                carePlan: expect.any(Object),
            })
        );
    });
});

// =============================================================================
// getHistory
// =============================================================================

describe('getHistory', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 200 with history array', async () => {
        pool.query.mockResolvedValue({
            rows: [
                { id: '1', original_filename: 'test.png', created_at: '2024-01-01' },
            ],
        });

        const req = mockReq();
        const res = mockRes();

        await controller.getHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                history: expect.any(Array),
            })
        );
    });

    test('should return 500 on database error', async () => {
        pool.query.mockRejectedValue(new Error('DB connection lost'));

        const req = mockReq();
        const res = mockRes();

        await controller.getHistory(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// =============================================================================
// getById
// =============================================================================

describe('getById', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return 200 with OCR result when found', async () => {
        pool.query.mockResolvedValue({
            rows: [{ id: 'abc-123', raw_text: 'Metformin 500mg' }],
        });

        const req = mockReq({ params: { id: 'abc-123' } });
        const res = mockRes();

        await controller.getById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                result: expect.any(Object),
            })
        );
    });

    test('should return 404 when OCR result not found', async () => {
        pool.query.mockResolvedValue({ rows: [] });

        const req = mockReq({ params: { id: 'nonexistent' } });
        const res = mockRes();

        await controller.getById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
