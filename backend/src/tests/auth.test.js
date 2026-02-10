const request = require('supertest');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Mock the database connection
jest.mock('../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(),
}));

// Mock email service to avoid sending real emails
jest.mock('../utils/email', () => ({
    sendOTPEmail: jest.fn().mockResolvedValue(true),
}));

// Mock audit logger
jest.mock('../utils/auditLogger', () => ({
    logAudit: jest.fn().mockResolvedValue(true),
}));

describe('Authentication Endpoints', () => {
    let app;

    beforeAll(() => {
        // Set env vars before requiring app
        process.env.JWT_SECRET = 'test-secret';
        process.env.OTP_EXPIRY_MINUTES = '10';
        process.env.PORT = '5000';
        process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
        process.env.doc = 'test';

        // We require app here to ensure mocks are applied first
        app = require('../app');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /auth/login', () => {
        it('should authenticate user with valid credentials (MFA disabled)', async () => {
            const password = 'password123';
            const passwordHash = await bcrypt.hash(password, 10);

            const mockUser = {
                user_id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password_hash: passwordHash,
                mfa_enabled: false,
                role_name: 'PATIENT',
                is_active: true,
                is_locked: false
            };

            // Mock pool.query response for user lookup
            pool.query.mockResolvedValueOnce({ rows: [mockUser] });

            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.role).toBe('PATIENT');
        });

        it('should require MFA if enabled', async () => {
            const password = 'password123';
            const passwordHash = await bcrypt.hash(password, 10);

            const mockUser = {
                user_id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password_hash: passwordHash,
                mfa_enabled: true,
                role_name: 'PATIENT',
                is_active: true,
                is_locked: false
            };

            // Mock pool.query response for user lookup
            pool.query.mockResolvedValueOnce({ rows: [mockUser] });
            // Mock pool.query for OTP update (reset used)
            pool.query.mockResolvedValueOnce({ rows: [] });
            // Mock pool.query for OTP insertion
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('mfaRequired', true);
            expect(res.body.message).toContain('OTP sent');
        });

        it('should return 401 for invalid credentials', async () => {
            // Mock pool.query response (empty rows)
            pool.query.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/auth/login')
                .send({
                    username: 'wronguser',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    // describe('POST /auth/register', () => {
    //     it('should register a new patient', async () => {
    //         // Test removed as per user request
    //     });
    // });
});
