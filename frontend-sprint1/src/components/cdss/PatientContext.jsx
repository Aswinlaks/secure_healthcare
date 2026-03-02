/**
 * PatientContext Component
 * Displays patient demographics, allergies, and medical history
 */
function PatientContext({ patient }) {
    if (!patient) return null;

    return (
        <div className="glass-card p-6 fade-in">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Patient Context
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Patient Info Cards */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Patient Name</p>
                    <p className="text-white font-medium">{patient.name}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Patient ID</p>
                    <p className="text-white font-medium">{patient.id}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Age</p>
                    <p className="text-white font-medium">{patient.age} years</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Gender</p>
                    <p className="text-white font-medium">{patient.gender}</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Allergies Section */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Known Allergies
                    </h3>
                    {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {patient.allergies.map((allergy, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-300 rounded-full text-sm"
                                >
                                    {allergy}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No known allergies</p>
                    )}
                </div>

                {/* Chronic Conditions Section */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Chronic Conditions
                    </h3>
                    {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {patient.chronicConditions.map((condition, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full text-sm"
                                >
                                    {condition}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No chronic conditions</p>
                    )}
                </div>
            </div>

            {/* Current Medications */}
            <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Current Medications
                </h3>
                {patient.currentMedications && patient.currentMedications.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {patient.currentMedications.map((medication, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-sky-500/20 border border-sky-500/30 text-sky-300 rounded-full text-sm"
                            >
                                {medication}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm">No current medications</p>
                )}
            </div>

            {/* Recent Lab Values */}
            {patient.recentLabValues && Object.keys(patient.recentLabValues).length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Recent Lab Values
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(patient.recentLabValues).map(([key, value]) => (
                            <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-white font-medium">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PatientContext;
