/**
 * Prescriptions Service Unit Tests
 *
 * Tests the business logic in prescriptions.service.js.
 * Mocks the repository layer and database pool.
 */

// Mock the repository
jest.mock('../../src/modules/prescriptions/prescriptions.repository', () => ({
    isDoctor: jest.fn(),
    getAppointment: jest.fn(),
    insertPrescription: jest.fn(),
    insertAudit: jest.fn(),
    getByAppointment: jest.fn(),
    getByPatient: jest.fn(),
}));

// Mock the database pool
jest.mock('../../src/config/db', () => ({
    query: jest.fn(),
    connect: jest.fn(),
}));

const service = require('../../src/modules/prescriptions/prescriptions.service');
const repo = require('../../src/modules/prescriptions/prescriptions.repository');
const pool = require('../../src/config/db');

// Helper data
const mockUser = { user_id: 'doctor-123', role: 'DOCTOR' };
const mockPatientUser = { user_id: 'patient-456', role: 'PATIENT', patient_id: 'patient-456' };

const mockPrescriptionData = {
    appointment_id: 'appt-001',
    medication_id: 'med-001',
    dosage: '500mg',
    frequency: 'Twice daily',
    start_date: '2024-01-01',
    end_date: '2024-01-31',
};

const mockAppointment = {
    appointment_id: 'appt-001',
    patient_id: 'patient-456',
    doctor_id: 'doctor-123',
    status: 'confirmed',
};

// =============================================================================
// createPrescription
// =============================================================================

describe('createPrescription', () => {
    let mockClient;

    beforeEach(() => {
        jest.clearAllMocks();
        mockClient = {
            query: jest.fn(),
            release: jest.fn(),
        };
        pool.connect.mockResolvedValue(mockClient);
    });

    test('should create prescription successfully for authorized doctor', async () => {
        repo.isDoctor.mockResolvedValue(true);
        repo.getAppointment.mockResolvedValue(mockAppointment);
        repo.insertPrescription.mockResolvedValue('presc-001');
        repo.insertAudit.mockResolvedValue();

        const result = await service.createPrescription(mockPrescriptionData, mockUser);

        expect(result).toHaveProperty('prescription_id', 'presc-001');
        expect(result).toHaveProperty('message', 'Prescription created successfully');
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
    });

    test('should throw 403 if user is not a doctor', async () => {
        repo.isDoctor.mockResolvedValue(false);

        await expect(
            service.createPrescription(mockPrescriptionData, mockPatientUser)
        ).rejects.toThrow('Only doctors can prescribe medication');
    });

    test('should throw 404 if appointment not found', async () => {
        repo.isDoctor.mockResolvedValue(true);
        repo.getAppointment.mockResolvedValue(undefined);

        await expect(
            service.createPrescription(mockPrescriptionData, mockUser)
        ).rejects.toThrow('Appointment not found');
    });

    test('should throw 403 if doctor is not assigned to appointment', async () => {
        repo.isDoctor.mockResolvedValue(true);
        repo.getAppointment.mockResolvedValue({
            ...mockAppointment,
            doctor_id: 'other-doctor-999',
        });

        await expect(
            service.createPrescription(mockPrescriptionData, mockUser)
        ).rejects.toThrow('Doctor not assigned to this appointment');
    });

    test('should rollback transaction on insert failure', async () => {
        repo.isDoctor.mockResolvedValue(true);
        repo.getAppointment.mockResolvedValue(mockAppointment);
        repo.insertPrescription.mockRejectedValue(new Error('Insert failed'));

        await expect(
            service.createPrescription(mockPrescriptionData, mockUser)
        ).rejects.toThrow('Insert failed');

        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });

    test('should use doctor_id from request body as fallback', async () => {
        const userWithoutId = { role: 'DOCTOR' };
        const dataWithDoctorId = { ...mockPrescriptionData, doctor_id: 'doctor-123' };

        repo.isDoctor.mockResolvedValue(true);
        repo.getAppointment.mockResolvedValue(mockAppointment);
        repo.insertPrescription.mockResolvedValue('presc-002');
        repo.insertAudit.mockResolvedValue();

        const result = await service.createPrescription(dataWithDoctorId, userWithoutId);
        expect(result.prescription_id).toBe('presc-002');
    });
});

// =============================================================================
// getByAppointment
// =============================================================================

describe('getByAppointment', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return prescriptions for an appointment', async () => {
        const mockPrescriptions = [
            { prescription_id: 'p1', dosage: '500mg' },
            { prescription_id: 'p2', dosage: '10mg' },
        ];
        repo.getByAppointment.mockResolvedValue(mockPrescriptions);

        const result = await service.getByAppointment('appt-001', mockUser);

        expect(result).toHaveProperty('appointment_id', 'appt-001');
        expect(result.prescriptions).toHaveLength(2);
        expect(repo.getByAppointment).toHaveBeenCalledWith('appt-001');
    });

    test('should return empty array if no prescriptions found', async () => {
        repo.getByAppointment.mockResolvedValue([]);

        const result = await service.getByAppointment('appt-empty', mockUser);

        expect(result.prescriptions).toHaveLength(0);
    });
});

// =============================================================================
// getByPatient
// =============================================================================

describe('getByPatient', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return prescriptions for authorized patient', async () => {
        const mockPrescriptions = [{ prescription_id: 'p1' }];
        repo.getByPatient.mockResolvedValue(mockPrescriptions);

        const result = await service.getByPatient('patient-456', mockPatientUser);

        expect(result).toHaveProperty('patient_id', 'patient-456');
        expect(result.prescriptions).toHaveLength(1);
    });

    test('should throw 403 if patient tries to view other patients prescriptions', async () => {
        await expect(
            service.getByPatient('other-patient-999', mockPatientUser)
        ).rejects.toThrow('Access denied');
    });

    test('should allow doctor to view any patients prescriptions', async () => {
        repo.getByPatient.mockResolvedValue([]);

        const result = await service.getByPatient('any-patient', mockUser);
        expect(result.patient_id).toBe('any-patient');
    });
});
