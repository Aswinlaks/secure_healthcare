import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VitalIntakeForm from '../../components/VitalIntakeForm';
import { submitVitals } from '../../api/vitalsApi';

// Mock the specific API service
vi.mock('../../api/vitalsApi', () => ({
    submitVitals: vi.fn()
}));

// Provide minimal mock for lucide-react icons used in form to prevent DOM clutter/crashes
vi.mock('lucide-react', () => ({
    Heart: () => <span data-testid="icon-heart">Icon</span>,
    Thermometer: () => <span data-testid="icon-thermometer">Icon</span>,
    Droplet: () => <span data-testid="icon-droplet">Icon</span>,
    Activity: () => <span data-testid="icon-activity">Icon</span>,
    Save: () => <span data-testid="icon-save">Icon</span>,
    CheckCircle: () => <span data-testid="icon-check">Icon</span>,
    AlertCircle: () => <span data-testid="icon-alert">Icon</span>,
    Loader2: () => <span data-testid="icon-loader">Icon</span>,
}));

describe('VitalIntakeForm Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all form fields correctly', () => {
        render(<VitalIntakeForm patientId="1234-uuid" />);

        expect(screen.getByText('Record Vital Signs')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g., 550e8400-e29b-41d4-a716-446655440000')).toHaveValue('1234-uuid');
        expect(screen.getByPlaceholderText('72')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('120/80')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('36.6')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('98')).toBeInTheDocument();
    });

    it('shows validation errors for empty fields on submit', async () => {
        render(<VitalIntakeForm patientId="" />);

        fireEvent.click(screen.getByText('Submit Vital Signs'));

        await waitFor(() => {
            expect(screen.getByText('Patient ID is required')).toBeInTheDocument();
            expect(screen.getAllByText('Required').length).toBeGreaterThan(0);
        });

        // Ensure API was not called due to validation failing
        expect(submitVitals).not.toHaveBeenCalled();
    });

    it('submits form payload and calls onSuccess upon successful API response', async () => {
        const onSuccessMock = vi.fn();
        submitVitals.mockResolvedValueOnce({}); // Mocks a 200 OK

        render(<VitalIntakeForm patientId="550e8400-e29b-41d4-a716-446655440000" onSuccess={onSuccessMock} />);

        // Fill out valid data
        fireEvent.change(screen.getByPlaceholderText('72'), { target: { value: '80' } });
        fireEvent.change(screen.getByPlaceholderText('120/80'), { target: { value: '110/70' } });
        fireEvent.change(screen.getByPlaceholderText('36.6'), { target: { value: '37.1' } });
        fireEvent.change(screen.getByPlaceholderText('98'), { target: { value: '99' } });

        fireEvent.click(screen.getByText('Submit Vital Signs'));

        await waitFor(() => {
            // Evaluates exact parsed typing expectations hitting the simulated network layer
            expect(submitVitals).toHaveBeenCalledWith({
                patient_id: '550e8400-e29b-41d4-a716-446655440000',
                heart_rate: 80,
                blood_pressure: '110/70',
                temperature: 37.1,
                spo2: 99
            });
            expect(screen.getByText('Vital signs recorded successfully!')).toBeInTheDocument();
            expect(onSuccessMock).toHaveBeenCalledTimes(1);
        });
    });

    it('displays error message from API when submission fails', async () => {
        submitVitals.mockRejectedValueOnce({
            response: { data: { error: 'Database timeout error' } }
        });

        render(<VitalIntakeForm patientId="550e8400-e29b-41d4-a716-446655440000" />);

        fireEvent.change(screen.getByPlaceholderText('72'), { target: { value: '80' } });
        fireEvent.change(screen.getByPlaceholderText('120/80'), { target: { value: '110/70' } });
        fireEvent.change(screen.getByPlaceholderText('36.6'), { target: { value: '37.1' } });
        fireEvent.change(screen.getByPlaceholderText('98'), { target: { value: '99' } });

        fireEvent.click(screen.getByText('Submit Vital Signs'));

        await waitFor(() => {
            expect(screen.getByText('Database timeout error')).toBeInTheDocument();
        });
    });
});
