import { useState } from 'react';

/**
 * AI Bot Panel Component
 * Allow patients (or doctors) to upload a diagnosis file and receive 
 * an AI-generated Care Plan and Diet Plan.
 */
function AIBotPanel({ apiBase }) {
    // State
    const [labReportFile, setLabReportFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploaded
    const [generating, setGenerating] = useState(false);
    const [insights, setInsights] = useState(null);
    const [error, setError] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLabReportFile(file);
        setUploadStatus('uploaded');
        setInsights(null);
        setError(null);
    };

    const handleClearFile = () => {
        setLabReportFile(null);
        setUploadStatus('idle');
        setInsights(null);
        setError(null);
    };

    const handleGenerateInsights = async () => {
        if (!labReportFile) {
            setError('Please upload a diagnosis file first.');
            return;
        }

        setGenerating(true);
        setError(null);
        setInsights(null);

        try {
            const formData = new FormData();
            formData.append('diagnosisFile', labReportFile);

            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${apiBase}/ai-bot/generate`, {
                method: 'POST',
                headers,
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setInsights(data.data);
            } else {
                setError(data.error || 'Failed to generate insights.');
            }
        } catch (err) {
            setError('Failed to connect to the AI service. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 fade-in border-t-4 border-t-teal-500">
                <h2 className="text-xl font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    AI Care & Diet Advisor
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    Upload your doctor's diagnosis file to instantly receive a personalized care plan and dietary recommendations powered by AI.
                </p>

                <div className="space-y-4">
                    {/* File Upload Section */}
                    <div>
                        <label className="block text-sm text-slate-700 mb-2 font-medium">
                            Diagnosis File (.txt)
                        </label>

                        <div className="relative">
                            {uploadStatus === 'idle' ? (
                                <label className="flex items-center justify-center gap-2 w-full bg-slate-50 border-2 border-dashed border-teal-300 hover:border-teal-500 cursor-pointer rounded-lg px-4 py-10 text-slate-500 transition-all hover:bg-teal-50/50">
                                    <div className="text-center">
                                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="font-medium text-slate-700 block mb-1">Click to Upload Diagnosis</span>
                                        <span className="text-xs text-slate-400">TXT files only</span>
                                        <input
                                            type="file"
                                            accept=".txt,text/plain"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </label>
                            ) : (
                                <div className="flex items-center justify-between w-full rounded-lg px-4 py-4 border bg-teal-50 border-teal-200">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-lg border border-teal-100 shadow-sm">
                                            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-teal-900">{labReportFile?.name}</p>
                                            <p className="text-xs text-teal-700">Ready for analysis</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClearFile}
                                        className="p-2 hover:bg-teal-100 rounded-full transition-colors text-slate-400 hover:text-teal-700"
                                        title="Remove file"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleGenerateInsights}
                            disabled={uploadStatus !== 'uploaded' || generating}
                            className={`w-full py-3.5 rounded-lg font-bold text-lg shadow-sm flex items-center justify-center gap-3 transition-all ${(uploadStatus !== 'uploaded' || generating)
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/25 border border-teal-700'
                                }`}
                        >
                            {generating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
                                    Analyzing Diagnosis...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Generate AI Care & Diet Plan
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-3 fade-in">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Display */}
            {insights && (
                <div className="space-y-6 fade-in">
                    {/* Diagnosis Summary Header */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
                        <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Diagnosis Summary</h3>
                        <p className="text-lg text-slate-800 font-medium">{insights.diagnosisSummary}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Care Plan Column */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 h-full border-t-4 border-t-slate-300">
                                <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    Care Plan
                                </h3>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                            Monitoring & Action Items
                                        </h4>
                                        <ul className="space-y-2">
                                            {insights.carePlan.monitoring.map((item, idx) => (
                                                <li key={idx} className="flex gap-3 text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <span className="text-sky-500 shrink-0">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Lifestyle Changes
                                        </h4>
                                        <ul className="space-y-2">
                                            {insights.carePlan.lifestyle.map((item, idx) => (
                                                <li key={idx} className="flex gap-3 text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <span className="text-emerald-500 shrink-0">•</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {insights.carePlan.followUp && insights.carePlan.followUp.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                Follow Up
                                            </h4>
                                            <ul className="space-y-2">
                                                {insights.carePlan.followUp.map((item, idx) => (
                                                    <li key={idx} className="flex gap-3 text-slate-700 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                        <span className="text-indigo-500 shrink-0">→</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Diet Plan Column */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 h-full border-t-4 border-t-slate-300">
                                <h3 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                                        </svg>
                                    </div>
                                    Diet Plan
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                            <h4 className="text-sm font-medium text-emerald-800 mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Recommended
                                            </h4>
                                            <ul className="space-y-2">
                                                {insights.dietPlan.recommended.map((item, idx) => (
                                                    <li key={idx} className="text-slate-700 text-sm flex gap-2">
                                                        <span className="text-emerald-500 font-bold shrink-0">+</span>
                                                        <span className="leading-tight">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                            <h4 className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
                                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                Foods to Avoid
                                            </h4>
                                            <ul className="space-y-2">
                                                {insights.dietPlan.avoid.map((item, idx) => (
                                                    <li key={idx} className="text-slate-700 text-sm flex gap-2">
                                                        <span className="text-red-500 font-bold shrink-0">-</span>
                                                        <span className="leading-tight">{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                            Meal Suggestions
                                        </h4>
                                        <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-100">
                                            {insights.dietPlan.mealSuggestions.map((item, idx) => (
                                                <div key={idx} className="p-3 text-sm text-slate-700 flex items-start gap-3">
                                                    <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="mt-0.5">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AIBotPanel;
