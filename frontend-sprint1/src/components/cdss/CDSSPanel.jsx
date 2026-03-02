import { useState, useCallback } from 'react';
import PatientContext from './PatientContext';
import CarePlanDisplay from '../CarePlanDisplay';

/**
 * CDSS Panel Component
 * Simplified for Patient Dashboard:
 * - Allows uploading a secure diagnosis file.
 * - Generates care plan based on the uploaded file.
 * - No manual patient selection or strict auth checks.
 */
function CDSSPanel({ apiBase }) {
    // State
    const [patientDetails, setPatientDetails] = useState(null);
    const [carePlan, setCarePlan] = useState(null);
    const [reasoning, setReasoning] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);

    // Lab report states
    const [labReportFile, setLabReportFile] = useState(null);
    const [labReportStatus, setLabReportStatus] = useState('idle'); // idle, uploading, verified, failed
    const [extractedDiagnosis, setExtractedDiagnosis] = useState(null);
    const [uploadError, setUploadError] = useState(null);

    // Fetch patient (for context display) ONLY after upload/verification gives us an ID
    const fetchPatientDetails = useCallback(async (patientId) => {
        if (!patientId) {
            setPatientDetails(null);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/patients/${patientId}`);
            const data = await response.json();

            if (data.success) {
                setPatientDetails(data.data);
            } else {
                // If patient not found (e.g. might be a new patient in the system or mock data issue),
                // we just proceed without details to avoid blocking the care plan.
                console.warn("Could not fetch details for patient ID:", patientId);
                setPatientDetails(null);
            }
        } catch (err) {
            console.error('Failed to fetch patient details', err);
        } finally {
            setLoading(false);
        }
    }, [apiBase]);

    const handleLabReportUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLabReportFile(file);
        setLabReportStatus('uploading');
        setExtractedDiagnosis(null);
        setUploadError(null);
        setCarePlan(null);
        setReasoning(null);
        setPatientDetails(null); // Clear previous context

        try {
            const formData = new FormData();
            formData.append('labReport', file);

            const response = await fetch(`${apiBase}/cdss/upload-lab-report`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setLabReportStatus('verified');
                setExtractedDiagnosis(data.data);

                // Auto-fetch details if we got a patient ID from the file
                if (data.data.patientId) {
                    fetchPatientDetails(data.data.patientId);
                }
            } else {
                setLabReportStatus('failed');
                setUploadError(data.error || 'Failed to process lab report');
            }
        } catch (err) {
            setLabReportStatus('failed');
            setUploadError('Failed to upload lab report. Please ensure the backend server is running.');
        }
    };

    const handleClearLabReport = () => {
        setLabReportFile(null);
        setLabReportStatus('idle');
        setExtractedDiagnosis(null);
        setUploadError(null);
        setCarePlan(null);
        setReasoning(null);
        setPatientDetails(null);
    };

    const handleGenerateCarePlan = async () => {
        if (!extractedDiagnosis) {
            setError('Please upload a verified diagnosis file first.');
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            // We use the patient ID from the diagnosis file
            const patientIdToUse = extractedDiagnosis.patientId;
            const patientNameToUse = patientDetails?.name || 'Patient';

            const response = await fetch(`${apiBase}/cdss/generate-care-plan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId: patientIdToUse,
                    patientName: patientNameToUse,
                    diagnosisCode: extractedDiagnosis.diagnosisCode,
                    excludeTreatments: true, // Always exclude medicines, only show diet
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCarePlan(data.data);
                setReasoning(data.reasoning);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to generate care plan. Please ensure the backend server is running.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 fade-in">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Care Plan Generation
                </h2>

                <div className="space-y-4">
                    {/* Lab Report Upload - Full Width */}
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">
                            Upload Diagnosis File (.txt)
                        </label>
                        {!labReportFile && (
                            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-sm text-blue-200">
                                Please upload the securely signed diagnosis file provided by your doctor.
                            </div>
                        )}
                        <div className="relative">
                            {labReportStatus === 'idle' ? (
                                <label className="
                                    flex items-center justify-center gap-2 w-full bg-slate-800 border-2 border-dashed border-slate-600 hover:border-sky-500 cursor-pointer
                                    rounded-lg px-4 py-8 text-slate-400 transition-all
                                ">
                                    <div className="text-center">
                                        <svg className="w-8 h-8 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="font-medium">Click to Upload File</span>
                                        <input
                                            type="file"
                                            accept=".txt,text/plain"
                                            onChange={handleLabReportUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </label>
                            ) : (
                                <div className={`
                                    flex items-center justify-between w-full rounded-lg px-4 py-4 border
                                    ${labReportStatus === 'uploading' ? 'bg-slate-800 border-slate-600' : ''}
                                    ${labReportStatus === 'verified' ? 'bg-emerald-500/10 border-emerald-500/30' : ''}
                                    ${labReportStatus === 'failed' ? 'bg-red-500/10 border-red-500/30' : ''}
                                `}>
                                    <div className="flex items-center gap-3">
                                        {labReportStatus === 'uploading' && (
                                            <>
                                                <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-slate-300">Analyzing Lab Report Details...</span>
                                            </>
                                        )}
                                        {labReportStatus === 'verified' && (
                                            <>
                                                <div className="bg-emerald-500/20 p-2 rounded-full">
                                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-emerald-400">Report Parsed</p>
                                                    <p className="text-xs text-emerald-300/70">Diagnosis identified</p>
                                                </div>
                                            </>
                                        )}
                                        {labReportStatus === 'failed' && (
                                            <>
                                                <div className="bg-red-500/20 p-2 rounded-full">
                                                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-red-400">Processing Failed</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleClearLabReport}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                                        title="Remove file"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        {labReportFile && labReportStatus !== 'idle' && (
                            <p className="text-xs text-slate-500 mt-2 ml-1 font-mono">{labReportFile.name}</p>
                        )}
                    </div>
                </div>

                {/* Extracted Diagnosis Info */}
                {extractedDiagnosis && labReportStatus === 'verified' && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium text-emerald-400">Extracted Information</h4>
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Secure</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-400 block text-xs">Diagnosis Code</span>
                                <span className="text-white font-mono">{extractedDiagnosis.diagnosisCode}</span>
                            </div>
                            <div>
                                <span className="text-slate-400 block text-xs">Condition</span>
                                <span className="text-white">{extractedDiagnosis.diagnosisName}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Error Display */}
                {uploadError && labReportStatus === 'failed' && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{uploadError}</span>
                    </div>
                )}

                {/* Generate Button */}
                <div className="mt-6">
                    <button
                        onClick={handleGenerateCarePlan}
                        disabled={labReportStatus !== 'verified' || generating}
                        className={`
                            w-full py-4 rounded-lg font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all
                            ${(labReportStatus !== 'verified' || generating)
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-emerald-500/20'
                            }
                        `}
                    >
                        {generating ? (
                            <>
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                Generating Diet & Care Plan...
                            </>
                        ) : (
                            <>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Generate Diet & Care Plan
                            </>
                        )}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
                        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Patient Context Panel - Only loaded if details found */}
            {loading && (
                <div className="flex justify-center p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Fetch context...</span>
                    </div>
                </div>
            )}

            {patientDetails && !loading && (
                <PatientContext patient={patientDetails} />
            )}

            {/* Care Plan Display */}
            {carePlan && reasoning && (
                <CarePlanDisplay carePlan={carePlan} reasoning={reasoning} />
            )}
        </div>
    );
}

export default CDSSPanel;

