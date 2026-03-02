import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, Activity, Pill, Utensils, FileText, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import api from '../api/client';

const CarePlanReview = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const [plan, setPlan] = useState(state?.plan);
    const [isEncrypting, setIsEncrypting] = useState(false);

    // If accessed directly without state, redirect back (or fetch if we had a real backend persistence for drafts)
    useEffect(() => {
        if (!plan) {
            navigate(`/patient/${id}/diagnosis`);
        }
    }, [plan, id, navigate]);

    const handleApprove = async () => {
        setIsEncrypting(true);

        // Simulate Encryption & Save
        // 1. Encrypt Plan
        // 2. API Post
        await new Promise(r => setTimeout(r, 1500));

        // In real app: await api.post('/care-plans', { ...plan, status: 'APPROVED', encryption: 'AES-256' });

        setIsEncrypting(false);
        navigate(`/patient/${id}/care-plan`, { state: { plan } });
    };

    if (!plan) return null;

    if (isEncrypting) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <ShieldCheck className="h-16 w-16 text-primary-600 animate-pulse" />
                <h2 className="mt-4 text-xl font-bold text-slate-900">Encrypting & Storing Record...</h2>
                <p className="text-slate-500">Applying AES-256 Encryption to Care Plan</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-slate-200">
                <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg leading-6 font-medium text-slate-900">Care Plan Review</h3>
                        <p className="mt-1 text-sm text-slate-500">AI-Generated Proposal • Requires Doctor Approval</p>
                    </div>
                    <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        <BrainCircuit className="h-4 w-4 text-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700">Rule Engine: Active</span>
                    </div>
                </div>

                <div className="px-4 py-5 sm:p-6 space-y-6">

                    {/* Diagnosis Section */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Diagnosis Nomalization</h4>
                        <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-900">{plan.conditionCode}</span>
                                <span className="text-xs text-slate-500 font-mono">Mapped from input: "{plan.diagnosisNormalized}"</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Alerts */}
                    {plan.alerts.length > 0 && (
                        <div className="space-y-2">
                            {plan.alerts.map((alert, idx) => (
                                <div key={idx} className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                <span className="font-bold">Clinical Alert:</span> {alert.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {/* Medications */}
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center mb-4">
                                <Pill className="h-5 w-5 text-blue-500 mr-2" />
                                <h4 className="font-semibold text-slate-900">Suggested Medication</h4>
                            </div>
                            <ul className="space-y-3">
                                {plan.medications.map((med, i) => (
                                    <li key={i} className="text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                        <div className="font-medium text-slate-900">{med.name} <span className="text-slate-500 font-normal">- {med.dosage}</span></div>
                                        <div className="text-xs text-slate-400 mt-1 italic">Reason: {med.reason}</div>
                                    </li>
                                ))}
                                {plan.medications.length === 0 && <li className="text-sm text-slate-400">No medication suggested.</li>}
                            </ul>
                        </div>

                        {/* Lifestyle & Diet */}
                        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                            <div className="flex items-center mb-4">
                                <Utensils className="h-5 w-5 text-green-500 mr-2" />
                                <h4 className="font-semibold text-slate-900">Lifestyle & Diet</h4>
                            </div>
                            <ul className="space-y-3">
                                {plan.diet.map((item, i) => (
                                    <li key={i} className="text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                        <div className="font-medium text-slate-900">{item.text}</div>
                                        <div className="text-xs text-slate-400 mt-1 italic">Reason: {item.reason}</div>
                                    </li>
                                ))}
                                {plan.lifestyle.map((item, i) => (
                                    <li key={'l-' + i} className="text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                                        <div className="font-medium text-slate-900">{item.text}</div>
                                        <div className="text-xs text-slate-400 mt-1 italic">Reason: {item.reason}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Rules Used */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-400">Knowledge Graph Rules Applied: </span>
                        {plan.rulesApplied.map(r => (
                            <span key={r} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 mr-2">
                                {r}
                            </span>
                        ))}
                    </div>

                </div>

                {/* Actions */}
                <div className="bg-slate-50 px-4 py-4 sm:px-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
                        onClick={() => navigate(`/ patient / ${id} / diagnosis`)}
                    >
                        <XCircle className="-ml-1 mr-2 h-4 w-4 text-slate-500" />
                        Reject / Modify
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
                        onClick={handleApprove}
                    >
                        <CheckCircle className="-ml-1 mr-2 h-4 w-4" />
                        Approve & Encrypt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CarePlanReview;
