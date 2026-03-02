import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import DiagnosisForm from '../components/DiagnosisForm';
import VitalsForm from '../components/VitalsForm';
import LabOrderForm from '../components/LabOrderForm';
import { AlertTriangle, ArrowLeft, ShieldAlert } from 'lucide-react';

const PatientDiagnosis = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [consentVerified, setConsentVerified] = useState(false);
    const [loading, setLoading] = useState(true);
    const [patientName, setPatientName] = useState('Patient'); // In real app, fetch patient details too

    useEffect(() => {
        checkConsent();
    }, [id]);

    const checkConsent = async () => {
        try {
            // CALL API: Check consent
            // const response = await api.get(`/patients/${id}/consent`);
            // setConsentVerified(response.data.hasConsent);

            // MOCK CONSENT CHECK
            // Simulating a delay
            await new Promise(resolve => setTimeout(resolve, 600));
            // Let's assume patients with even IDs have consent, odd don't, for testing
            const hasConsent = true; // Forcing true for Sprint 1 demo flow as requested "Consent Verified? YES -> Enter Diagnosis"

            // Ideally:
            // if (response.data.hasConsent) setConsentVerified(true);

            setConsentVerified(hasConsent);
        } catch (error) {
            console.error("Consent check failed", error);
            setConsentVerified(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-500">Verifying patient consent...</div>;
    }

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-sm text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </button>

            <div className="border-b border-slate-200 pb-5">
                <h3 className="text-lg leading-6 font-medium text-slate-900">
                    Patient Diagnosis: <span className="text-primary-600">ID #{id}</span>
                </h3>
            </div>

            {!consentVerified ? (
                <div className="rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ShieldAlert className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Consent Missing</h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>
                                    Patient consent has not been verified for this procedure.
                                    Diagnosis entry is blocked until consent is recorded.
                                </p>
                            </div>
                            <div className="mt-4">
                                <button
                                    type="button"
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Request Consent
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    <DiagnosisForm patientId={id} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <VitalsForm patientId={id} />
                        <LabOrderForm patientId={id} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDiagnosis;
