const request = require('supertest');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Mock the database connection
jest.mock('../config/db', () => ({
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(),
}));

// Mock audit logger
jest.mock('../utils/auditLogger', () => ({
    logAudit: jest.fn().mockResolvedValue(true),
}));

describe('Doctor Dashboard Endpoints', () => {
    let app;
    let doctorToken;
    let doctorUserId = 'doctor-123';

    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret';
        app = require('../app');

        // Generate a valid doctor token
        doctorToken = jwt.sign(
            { user_id: doctorUserId, role: 'DOCTOR' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /appointments/doctor', () => {
        it('should fetch doctor appointments', async () => {
            const mockAppointments = [
                {
                    appointment_id: 1,
                    doctor_id: 'doc-1',
                    patient_id: 'pat-1',
                    scheduled_start: '2026-02-10T10:00:00Z',
                    status: 'SCHEDULED',
                    full_name_encrypted: 'EncryptedName'
                }
            ];

            // Mock pool.query for getDoctorAppointments
            // The controller/service query likely joins tables. 
            // We just need to ensure the mock returns what the service expects.
            pool.query.mockResolvedValueOnce({ rows: mockAppointments });

            const res = await request(app)
                .get('/appointments/doctor')
                .set('Authorization', `Bearer ${doctorToken}`);

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0]).toHaveProperty('appointment_id', 1);
        });
    });

    describe('POST /labs/lab-orders', () => {
        it('should create a new lab order', async () => {
            const newOrder = {
                order_id: 101,
                patient_id: 'pat-1',
                doctor_id: doctorUserId,
                test_name: 'Blood Test',
                status: 'PENDING'
            };

            // Mock pool.query for createLabOrder
            // It likely does an INSERT and RETURNING *
            pool.query.mockResolvedValue({ rows: [newOrder] });

            const res = await request(app)
                .post('/labs/lab-orders')
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    patient_id: 'pat-1',
                    test_name: 'Blood Test'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('order_id', 101);
            expect(res.body.status).toBe('PENDING');
        });

        it('should fail without patient_id', async () => {
            const res = await request(app)
                .post('/labs/lab-orders')
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    test_name: 'Blood Test'
                });

            expect(res.statusCode).toBe(400);
        });
    });
});
