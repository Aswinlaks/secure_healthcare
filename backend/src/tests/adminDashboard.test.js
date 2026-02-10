const request = require('supertest');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Mock the database connection with client support for transactions
const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
};

jest.mock('../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn(),
}));

// Mock encryption utils
jest.mock('../utils/encryption', () => ({
    encrypt: jest.fn((val) => `encrypted_${val}`),
    decrypt: jest.fn((val) => val.replace('encrypted_', '')),
}));

// Mock audit logger
jest.mock('../utils/auditLogger', () => ({
    logAudit: jest.fn().mockResolvedValue(true),
}));


describe('Admin Dashboard Endpoints', () => {
    let app;
    let adminToken;
    let adminUserId = 'admin-123';

    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret';
        // Define connect return value here or in the mock definition
        pool.connect.mockResolvedValue(mockClient);

        app = require('../app');

        // Generate a valid admin token
        adminToken = jwt.sign(
            { user_id: adminUserId, role: 'ADMIN' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /admin/users', () => {
        it('should fetch all users', async () => {
            const mockUsers = [
                {
                    user_id: 1,
                    username: 'testadmin',
                    is_active: true,
                    created_at: '2026-01-01',
                    role_name: 'ADMIN'
                }
            ];

            pool.query.mockResolvedValueOnce({ rows: mockUsers });

            const res = await request(app)
                .get('/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0].username).toBe('testadmin');
        });
    });

    describe('POST /admin/users', () => {
        it('should create a new doctor user', async () => {
            // Setup mock client queries

            // 1. Check existing user (BEGIN is first, then SELECT)
            mockClient.query.mockResolvedValueOnce({}); // BEGIN
            mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); // SELECT existing

            // 2. Insert user
            mockClient.query.mockResolvedValueOnce({ rows: [{ user_id: 'new-doc-id' }] });

            // 3. Resolve role_id
            mockClient.query.mockResolvedValueOnce({ rowCount: 1, rows: [{ role_id: 2 }] });

            // 4. Insert user_roles
            mockClient.query.mockResolvedValueOnce({});

            // 5. Insert doctor details
            mockClient.query.mockResolvedValueOnce({});

            // 6. Audit log
            mockClient.query.mockResolvedValueOnce({});

            // 7. COMMIT
            mockClient.query.mockResolvedValueOnce({});


            const res = await request(app)
                .post('/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'newdoc',
                    email: 'doc@example.com',
                    password: 'password123',
                    role: 'DOCTOR',
                    full_name: 'Dr. Smith',
                    specialization: 'Cardiology',
                    department: 'Cardio',
                    consultation_fee: 100,
                    experience_years: 10,
                    qualification: 'MD',
                    phone_number: '1234567890'
                });

            if (res.statusCode !== 201) {
                console.error('Create User Failed:', res.body);
            }

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('user_id', 'new-doc-id');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    describe('GET /admin/audit-logs', () => {
        it('should return audit logs', async () => {
            // Count query
            pool.query.mockResolvedValueOnce({ rows: [{ count: 5 }] });
            // Logs query
            pool.query.mockResolvedValueOnce({ rows: [{ action: 'LOGIN' }] });

            const res = await request(app)
                .get('/admin/audit-logs')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.count).toBe(5);
        });
    });
});
