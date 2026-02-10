const doctorsRepo = require('../modules/doctors/doctors.repository');
const pool = require('../config/db');

jest.mock('../config/db', () => ({
    query: jest.fn(),
}));

describe('Doctors Repository', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllDoctors', () => {
        it('should return all active doctors', async () => {
            const mockDoctors = [
                { doctor_id: '1', full_name: 'Dr. Smith', specialization: 'Cardiology' },
                { doctor_id: '2', full_name: 'Dr. Jones', specialization: 'Neurology' },
            ];

            pool.query.mockResolvedValueOnce({ rows: mockDoctors });

            const result = await doctorsRepo.getAllDoctors();

            expect(result).toEqual(mockDoctors);
            expect(pool.query).toHaveBeenCalledTimes(1);
            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT doctor_id, full_name, specialization'));
            expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE is_active = true'));
        });

        it('should return empty array if no active doctors', async () => {
            pool.query.mockResolvedValueOnce({ rows: [] });

            const result = await doctorsRepo.getAllDoctors();

            expect(result).toEqual([]);
        });

        it('should throw error if database query fails', async () => {
            const dbError = new Error('Database error');
            pool.query.mockRejectedValueOnce(dbError);

            await expect(doctorsRepo.getAllDoctors()).rejects.toThrow('Database error');
        });
    });
});
