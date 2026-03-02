import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Save, CheckCircle, AlertCircle, Loader2, BrainCircuit } from 'lucide-react';
import { generateCarePlan } from '../api/mockCarePlan';
import { useNavigate } from 'react-router-dom';

const DiagnosisForm = ({ patientId }) => {
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const { user } = useAuth();

    // Mock Normalization Function
    const normalizeDiagnosis = (text) => {
        // In a real app, this would call a coding service (ICD-10 etc)
        const normalizedMap = {
            'headache': 'R51 - Headache',
            'flu': 'J10.1 - Influenza with other respiratory manifestations',
            'fever': 'R50.9 - Fever, unspecified',
            'cold': 'J00 - Acute nasopharyngitis [common cold]'
        };

        // Simple lookup or return original if not found
        for (const [key, value] of Object.entries(normalizedMap)) {
            if (text.toLowerCase().includes(key)) return value;
        }
        return text + ' (Uncoded)';
    };

    const [analyzingStep, setAnalyzingStep] = useState(''); // 'graph', 'rules', ''
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            // 1. Start Analysis
            setAnalyzingStep('graph'); // "Traversing Knowledge Graph..."

            // Call Mock Service
            const generatedPlan = await generateCarePlan(data.diagnosis, patientId);

            setAnalyzingStep('rules'); // "Applying Rule Engine..."
            await new Promise(resolve => setTimeout(resolve, 1000)); // Extra delay for effect

            // 2. Navigate to Review
            navigate(`/patient/${patientId}/review-plan`, { state: { plan: generatedPlan } });

        } catch (error) {
            console.error("Submission failed", error);
            setSubmitError("Failed to submit diagnosis. Please try again.");
            setIsSubmitting(false);
        }
    };

    if (submitSuccess) {
        return (
            <div className="bg-green-50 rounded-lg p-6 text-center animate-fade-in shadow-sm border border-green-100">
                <div className="flex justify-center mb-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-green-900">Diagnosis Submitted Successfully</h3>
                <p className="mt-2 text-sm text-green-600">
                    The Record has been updated and the action has been logged for audit purposes.
                </p>
                <button
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    Add Another Diagnosis
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-slate-200">
            <div className="px-4 py-5 sm:px-6 bg-slate-50 border-b border-slate-200">
                <h3 className="text-lg leading-6 font-medium text-slate-900">Clinical Diagnosis Entry</h3>
                <p className="mt-1 text-sm text-slate-500">Please provide detailed clinical observations.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="diagnosis" className="block text-sm font-medium text-slate-700">
                            Primary Diagnosis *
                        </label>
                        <div className="mt-1 relative">
                            <input
                                id="diagnosis"
                                {...register('diagnosis', {
                                    required: 'Diagnosis is required',
                                    minLength: { value: 3, message: 'Diagnosis must be at least 3 characters' }
                                })}
                                type="text"
                                className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-slate-300 rounded-md py-2 px-3 border ${errors.diagnosis ? 'border-red-300 ring-red-200 ring-1' : ''}`}
                                placeholder="e.g. Acute Migraine"
                            />
                            {errors.diagnosis && (
                                <p className="mt-1 text-sm text-red-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    {errors.diagnosis.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                            Clinical Notes
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="notes"
                                rows={4}
                                {...register('notes')}
                                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-slate-300 rounded-md py-2 px-3 border"
                                placeholder="Additional observations..."
                            />
                        </div>
                    </div>

                    {submitError && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">{submitError}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end border-t border-slate-100 pt-5">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <BrainCircuit className="animate-pulse -ml-1 mr-2 h-4 w-4" />
                                    {analyzingStep === 'graph' ? 'Traversing Graph...' : 'Applying Rules...'}
                                </>
                            ) : (
                                <>
                                    <BrainCircuit className="-ml-1 mr-2 h-4 w-4" />
                                    Analyze & Plan
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DiagnosisForm;
