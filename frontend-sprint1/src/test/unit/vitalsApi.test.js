import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../api/client';
import { submitVitals, fetchPatientVitals } from '../../api/vitalsApi';

// Mock the base axios client
vi.mock('../../api/client', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn()
    }
}));

describe('vitalsApi Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('submitVitals', () => {
        it('should call api.post with correct endpoint and payload', async () => {
            const mockData = { patient_id: '123-uuid', heart_rate: 80 };
            const mockResponse = { data: { success: true, data: mockData } };

            api.post.mockResolvedValueOnce(mockResponse);

            const result = await submitVitals(mockData);

            expect(api.post).toHaveBeenCalledWith('/api/vitals', mockData);
            expect(result).toEqual(mockResponse);
        });

        it('should bubble up errors on failure', async () => {
            const mockError = new Error('Network Error');
            api.post.mockRejectedValueOnce(mockError);

            await expect(submitVitals({})).rejects.toThrow('Network Error');
        });
    });

    describe('fetchPatientVitals', () => {
        it('should call api.get with correct parameter endpoint', async () => {
            const patientId = '123-uuid';
            const mockResponse = { data: { data: { patient_id: patientId, vitals: [] } } };

            api.get.mockResolvedValueOnce(mockResponse);

            const result = await fetchPatientVitals(patientId);

            expect(api.get).toHaveBeenCalledWith('/api/vitals/123-uuid');
            expect(result).toEqual(mockResponse);
        });
    });
});
