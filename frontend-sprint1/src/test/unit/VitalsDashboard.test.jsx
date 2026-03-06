import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VitalsDashboard from '../../pages/VitalsDashboard';
import { fetchPatientVitals } from '../../api/vitalsApi';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../../api/vitalsApi', () => ({
    fetchPatientVitals: vi.fn()
}));

vi.mock('../../api/client', () => ({
    default: {
        get: vi.fn()
    }
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));

// Mock Recharts to avoid SVG/DOM rendering complexity in JSDOM
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />
}));

// Mock Lucide Icons
vi.mock('lucide-react', () => ({
    Heart: () => <span>HeartIcon</span>,
    Thermometer: () => <span>ThermometerIcon</span>,
    Droplet: () => <span>DropletIcon</span>,
    Activity: () => <span>ActivityIcon</span>,
    Search: () => <span>SearchIcon</span>,
    Loader2: () => <span>LoaderIcon</span>,
    AlertTriangle: () => <span>AlertIcon</span>,
    TrendingUp: () => <span>TrendingIcon</span>,
    Save: () => <span>SaveIcon</span>
}));

const renderDashboard = () => {
    return render(
        <BrowserRouter>
            <VitalsDashboard />
        </BrowserRouter>
    );
};

describe('VitalsDashboard Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Doctor View', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                user: { role: 'DOCTOR' }
            });
        });

        it('renders the doctor layout with search bar and patient list fetching', async () => {
            api.get.mockResolvedValueOnce({
                data: [{ patient_id: '123-uuid', full_name: 'John Doe' }]
            });

            renderDashboard();

            expect(screen.getByText('Vitals Dashboard')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Search by patient name...')).toBeInTheDocument();

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledWith('/patients');
            });
        });
    });

    describe('Patient View', () => {
        beforeEach(() => {
            useAuth.mockReturnValue({
                user: { role: 'PATIENT', sub: '999-uuid' }
            });
        });

        it('fetches vitals automatically on load for the logged-in patient', async () => {
            fetchPatientVitals.mockResolvedValueOnce({
                data: { data: { vitals: [] } }
            });

            renderDashboard();

            await waitFor(() => {
                expect(fetchPatientVitals).toHaveBeenCalledWith('999-uuid');
                expect(screen.getByText('No vitals history found.')).toBeInTheDocument();
            });
        });

        it('displays metric cards and charts when vitals exist', async () => {
            fetchPatientVitals.mockResolvedValueOnce({
                data: {
                    data: {
                        vitals: [
                            {
                                id: 1,
                                created_at: '2023-10-01T10:00:00Z',
                                heart_rate: 115, // High (Critical Red)
                                blood_pressure: '120/80', // Normal (Green)
                                temperature: '36.6', // Normal (Green)
                                spo2: 92 // Low (Amber/Red)
                            }
                        ]
                    }
                }
            });

            renderDashboard();

            await waitFor(() => {
                // Heart Rate (Critical)
                expect(screen.getByText('115')).toBeInTheDocument();
                // Blood Pressure
                expect(screen.getByText('120/80')).toBeInTheDocument();
                // Temp
                expect(screen.getByText('36.6')).toBeInTheDocument();
                // SpO2
                expect(screen.getByText('92')).toBeInTheDocument();

                // Charts should render
                expect(screen.getAllByTestId('recharts-container').length).toBe(2);
            });
        });
    });
});
