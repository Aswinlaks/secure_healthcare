import { useState } from 'react';

/**
 * CarePlanDisplay Component
 * Displays the generated care plan with treatments, diet, and explainability
 */
function CarePlanDisplay({ carePlan, reasoning }) {
    const [activeTab, setActiveTab] = useState('treatments');

    if (!carePlan) return null;

    const tabs = [
        { id: 'treatments', label: 'Treatments', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { id: 'diet', label: 'Diet Plan', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { id: 'warnings', label: 'Warnings', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ];

    return (
        <div className="bg-white shadow rounded-xl border border-slate-200 overflow-hidden fade-in">
            {/* Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-200">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Generated Care Plan
                        </h2>
                        <p className="text-slate-600 mt-1">
                            For: <span className="font-semibold text-slate-900">{carePlan.patientName}</span> &bull;
                            Diagnosis: <span className="text-teal-700 font-medium">{carePlan.diagnosis.name}</span>
                        </p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                        <p>Generated: {new Date(carePlan.generatedAt).toLocaleString()}</p>
                        <p className="text-xs">Rules Applied: {reasoning.totalRules}</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto bg-white">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2
              ${activeTab === tab.id
                                ? 'text-teal-700 border-teal-600 bg-teal-50/50'
                                : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                            }
            `}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                        </svg>
                        {tab.label}
                        {tab.id === 'warnings' && carePlan.warnings.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                {carePlan.warnings.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 bg-white min-h-[400px]">
                {/* Treatments Tab */}
                {activeTab === 'treatments' && (
                    <div className="space-y-6">
                        {/* Recommended Treatments */}
                        <div>
                            <h3 className="text-sm font-semibold text-teal-700 uppercase tracking-wide mb-4">
                                Recommended Treatments ({carePlan.treatments.length})
                            </h3>
                            {carePlan.treatments.length > 0 ? (
                                <div className="space-y-3">
                                    {carePlan.treatments.map((treatment, index) => (
                                        <div
                                            key={treatment.id}
                                            className="bg-white rounded-lg p-4 border-l-4 border-teal-500 shadow-sm border-y border-r border-slate-200 slide-in"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-slate-900 font-medium">{treatment.name}</h4>
                                                    {treatment.examples && (
                                                        <p className="text-sm text-slate-600 mt-1">
                                                            Examples: {treatment.examples.join(', ')}
                                                        </p>
                                                    )}
                                                    {treatment.dosage && (
                                                        <p className="text-sm text-teal-600 mt-1 font-medium">
                                                            Dosage: {treatment.dosage}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`
                          px-2 py-1 text-xs rounded font-medium
                          ${treatment.priority === 1 ? 'bg-teal-100 text-teal-800' : ''}
                          ${treatment.priority === 2 ? 'bg-sky-100 text-sky-800' : ''}
                          ${treatment.priority >= 3 ? 'bg-slate-100 text-slate-800' : ''}
                        `}>
                                                    Priority {treatment.priority}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500">No treatments recommended</p>
                            )}
                        </div>

                        {/* Excluded Treatments */}
                        {carePlan.excludedTreatments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">
                                    Excluded Treatments ({carePlan.excludedTreatments.length})
                                </h3>
                                <div className="space-y-3">
                                    {carePlan.excludedTreatments.map((treatment, index) => (
                                        <div
                                            key={treatment.id}
                                            className="bg-white rounded-lg p-4 border-l-4 border-red-500 shadow-sm border-y border-r border-slate-200 opacity-75"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-slate-500 font-medium line-through">{treatment.name}</h4>
                                                    <p className="text-sm text-red-600 mt-1">
                                                        ⚠️ Excluded: {treatment.exclusionReason}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monitoring Requirements */}
                        {carePlan.monitoring.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-violet-700 uppercase tracking-wide mb-4">
                                    Monitoring Required
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {carePlan.monitoring.map((item, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-violet-50 border border-violet-100 text-violet-700 rounded-full text-sm font-medium"
                                        >
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Diet Tab */}
                {activeTab === 'diet' && (
                    <div>
                        <h3 className="text-sm font-semibold text-teal-700 uppercase tracking-wide mb-4">
                            Dietary Recommendations ({carePlan.dietPlan.length})
                        </h3>
                        {carePlan.dietPlan.length > 0 ? (
                            <div className="space-y-3">
                                {carePlan.dietPlan.map((diet, index) => (
                                    <div
                                        key={diet.id}
                                        className="bg-white rounded-lg p-4 border-l-4 border-teal-500 shadow-sm border-y border-r border-slate-200 slide-in"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-slate-900 font-medium">{diet.name}</h4>
                                                <p className="text-sm text-slate-600 mt-1">{diet.description}</p>
                                            </div>
                                            <span className={`
                        px-2 py-1 text-xs rounded font-medium
                        ${diet.priority === 1 ? 'bg-teal-100 text-teal-800' : 'bg-sky-100 text-sky-800'}
                      `}>
                                                Priority {diet.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500">No specific dietary recommendations</p>
                        )}
                    </div>
                )}



                {/* Warnings Tab */}
                {activeTab === 'warnings' && (
                    <div>
                        <h3 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-4">
                            Clinical Warnings & Alerts
                        </h3>
                        {carePlan.warnings.length > 0 ? (
                            <div className="space-y-3">
                                {carePlan.warnings.map((warning, index) => (
                                    <div
                                        key={index}
                                        className={`
                      rounded-lg p-4 slide-in border shadow-sm
                      ${warning.severity === 'high'
                                                ? 'bg-red-50 border-red-200'
                                                : 'bg-amber-50 border-amber-200'
                                            }
                    `}
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <svg
                                                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${warning.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <div className="flex-1">
                                                <p className={`font-medium ${warning.severity === 'high' ? 'text-red-800' : 'text-amber-800'}`}>
                                                    {warning.message}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                    <span className="capitalize">{warning.type.replace('_', ' ')}</span>
                                                    <span className={`
                            px-2 py-0.5 rounded
                            ${warning.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}
                          `}>
                                                        {warning.severity} severity
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-12 h-12 text-teal-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-slate-400">No warnings or alerts for this care plan</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CarePlanDisplay;
