const request = require('supertest');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Mock the database connection
jest.mock('../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(),
}));

// Mock middleware
jest.mock('../middleware/labKey.middleware', () => ({
    attachLabPrivateKey: (req, res, next) => {
        req.labPrivateKey = 'mock-private-key-pem'; // Fake key
        next();
    },
    attachDoctorPrivateKey: (req, res, next) => {
        req.doctorPrivateKey = 'mock-doctor-key-pem';
        next();
    }
}));

// Mock digitalSignature utils
jest.mock('../utils/digitalSignature', () => ({
    hashData: jest.fn(() => 'mock-hash'),
    signHash: jest.fn(() => 'mock-signature'),
    verifySignature: jest.fn(() => true),
}));

jest.mock('../utils/auditLogger', () => ({
    logAudit: jest.fn().mockResolvedValue(true),
}));

describe('Lab Tech Dashboard Endpoints', () => {
    let app;
    let labTechToken;
    let labTechUserId = 'labtech-123';

    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret';
        app = require('../app');

        // Generate Lab Tech Token
        labTechToken = jwt.sign(
            { user_id: labTechUserId, role: 'LAB_TECH' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /labs/pending-orders', () => {
        it('should fetch pending lab orders', async () => {
            const mockOrders = [
                {
                    order_id: 10,
                    test_name: 'CBC',
                    status: 'PENDING',
                    patient_name: 'John Doe'
                }
            ];

            pool.query.mockResolvedValueOnce({ rows: mockOrders });

            const res = await request(app)
                .get('/labs/pending-orders')
                .set('Authorization', `Bearer ${labTechToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body[0].test_name).toBe('CBC');
        });
    });

    // describe('POST /labs/reports', () => {
    //     it('should upload a lab report', async () => {
    //         // Test removed as per user request
    //     });
    // });
});
