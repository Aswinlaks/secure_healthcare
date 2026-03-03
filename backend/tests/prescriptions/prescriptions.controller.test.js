/**
 * Prescriptions Controller Unit Tests
 *
 * Tests the HTTP request/response handling in prescriptions.controller.js.
 * Mocks the service layer to isolate controller logic.
 */

// Mock the service layer
jest.mock('../../src/modules/prescriptions/prescriptions.service', () => ({
    createPrescription: jest.fn(),
    getByAppointment: jest.fn(),
    getByPatient: jest.fn(),
}));

const controller = require('../../src/modules/prescriptions/prescriptions.controller');
const service = require('../../src/modules/prescriptions/prescriptions.service');

// Helper functions
const mockReq = (overrides = {}) => ({
    body: {},
    params: {},
    user: { user_id: 'doctor-123', role: 'DOCTOR' },
    ...overrides,
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// =============================================================================
// createPrescription
// =============================================================================

describe('createPrescription controller', () => {
    beforeEach(() => jest.clearAllMocks());

    test('should return 201 on successful creation', async () => {
        service.createPrescription.mockResolvedValue({
            prescription_id: 'presc-001',
            message: 'Prescription created successfully',
        });

        const req = mockReq({
            body: {
                appointment_id: 'appt-001',
                medication_id: 'med-001',
                dosage: '500mg',
                frequency: 'Twice daily',
                start_date: '2024-01-01',
                end_date: '2024-01-31',
            },
        });
        const res = mockRes();

        await controller.createPrescription(req, res);

        expect(service.createPrescription).toHaveBeenCalledWith(req.body, req.user);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ prescription_id: 'presc-001' })
        );
    });

    test('should return 403 when service throws authorization error', async () => {
        const err = new Error('Only doctors can prescribe medication');
        err.status = 403;
        service.createPrescription.mockRejectedValue(err);

        const req = mockReq({ user: { user_id: 'patient-123', role: 'PATIENT' } });
        const res = mockRes();

        await controller.createPrescription(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Only doctors can prescribe medication' });
    });

    test('should return 500 on unexpected error', async () => {
        service.createPrescription.mockRejectedValue(new Error('Unexpected'));

        const req = mockReq();
        const res = mockRes();

        await controller.createPrescription(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// =============================================================================
// getByAppointment
// =============================================================================

describe('getByAppointment controller', () => {
    beforeEach(() => jest.clearAllMocks());

    test('should return 200 with prescriptions', async () => {
        service.getByAppointment.mockResolvedValue({
            appointment_id: 'appt-001',
            prescriptions: [{ prescription_id: 'p1' }],
        });

        const req = mockReq({ params: { appointment_id: 'appt-001' } });
        const res = mockRes();

        await controller.getByAppointment(req, res);

        expect(service.getByAppointment).toHaveBeenCalledWith('appt-001', req.user);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                appointment_id: 'appt-001',
                prescriptions: expect.any(Array),
            })
        );
    });

    test('should return 500 on service error', async () => {
        service.getByAppointment.mockRejectedValue(new Error('DB error'));

        const req = mockReq({ params: { appointment_id: 'appt-001' } });
        const res = mockRes();

        await controller.getByAppointment(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

// =============================================================================
// getByPatient
// =============================================================================

describe('getByPatient controller', () => {
    beforeEach(() => jest.clearAllMocks());

    test('should return 200 with patient prescriptions', async () => {
        service.getByPatient.mockResolvedValue({
            patient_id: 'patient-456',
            prescriptions: [{ prescription_id: 'p1' }, { prescription_id: 'p2' }],
        });

        const req = mockReq({ params: { patient_id: 'patient-456' } });
        const res = mockRes();

        await controller.getByPatient(req, res);

        expect(service.getByPatient).toHaveBeenCalledWith('patient-456', req.user);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                patient_id: 'patient-456',
                prescriptions: expect.arrayContaining([
                    expect.objectContaining({ prescription_id: 'p1' }),
                ]),
            })
        );
    });

    test('should return 403 when access denied', async () => {
        const err = new Error('Access denied');
        err.status = 403;
        service.getByPatient.mockRejectedValue(err);

        const req = mockReq({
            params: { patient_id: 'other-patient' },
            user: { user_id: 'patient-456', role: 'PATIENT' },
        });
        const res = mockRes();

        await controller.getByPatient(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
});
