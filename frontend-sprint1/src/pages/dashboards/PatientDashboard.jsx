import { useState, useEffect } from 'react';
import { Calendar, FileText, ArrowRight, Beaker, CheckCircle, Lock, Download, Loader2, Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Modal from '../../components/Modal';

const PatientDashboard = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [labReports, setLabReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState(null);

    // Appointment Modal State
    const [viewingAppointment, setViewingAppointment] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Appointments
                const apptRes = await api.get('/appointments/my-appointments');
                if (apptRes.data && apptRes.data.length > 0) {
                    // Filter for future appointments and sort by date
                    const future = apptRes.data
                        .filter(a => new Date(a.scheduled_start) > new Date())
                        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
                    setAppointments(future);
                }

                // Fetch Lab Reports
                const labsRes = await api.get('/labs/my-reports');
                setLabReports(labsRes.data || []);

            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleViewReport = async (reportId) => {
        setLoadingReport(true);
        setIsModalOpen(true);
        setSelectedReport(null);
        setError(null);

        try {
            const response = await api.get(`/labs/reports/${reportId}`);
            setSelectedReport(response.data);
        } catch (err) {
            console.error("Failed to fetch report details", err);
            setError(err.response?.data?.error || "Failed to load report details.");
        } finally {
            setLoadingReport(false);
        }
    };

    const handleDownloadReport = async (e, report) => {
        e.stopPropagation();
        setDownloadingId(report.report_id);

        try {
            let fullReport = report;

            if (!report.result) {
                const response = await api.get(`/labs/reports/${report.report_id}`);
                fullReport = response.data;
            }

            const lines = [];
            lines.push(`LAB REPORT`);
            lines.push(`==========================================`);
            lines.push(`Report ID: ${fullReport.report_id}`);
            lines.push(`Test Name: ${fullReport.test_name || fullReport.result?.testName || 'Unknown Test'}`);
            lines.push(`Date: ${new Date(fullReport.verified_at || fullReport.ordered_at).toLocaleString()}`);
            lines.push(`Patient: ${user.name} (ID: ${user.sub})`);
            lines.push(`==========================================`);
            lines.push(``);
            lines.push(`RESULTS:`);

            if (typeof fullReport.result === 'string') {
                lines.push(fullReport.result);
            } else if (typeof fullReport.result === 'object') {
                Object.entries(fullReport.result || {}).forEach(([key, value]) => {
                    if (key === 'testName') return;
                    lines.push(`${key}: ${JSON.stringify(value)}`);
                });
            }

            if (fullReport.verified) {
                lines.push(``);
                lines.push(`[VERIFIED] This report has been digitally signed by the doctor.`);
                if (fullReport.diagnosis) {
                    lines.push(``);
                    lines.push(`DIAGNOSIS / DOCTOR'S COMMENTS:`);
                    lines.push(fullReport.diagnosis);
                }
            } else {
                lines.push(``);
                lines.push(`[PENDING VERIFICATION] results are preliminary.`);
            }

            const testName = fullReport.test_name || fullReport.result?.testName || 'Unknown_Test';
            const fileContent = lines.join('\n');
            const blob = new Blob([fileContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Lab_Report_${testName.replace(/\s+/g, '_')}_${fullReport.report_id}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Failed to download report", err);
            alert("Failed to download report. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    const closeReportModal = () => {
        setIsModalOpen(false);
        setSelectedReport(null);
        setError(null);
    };

    const nextAppointment = appointments[0] || null;

    return (
        <div className="space-y-6">
            {/* Wellness Banner */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
                <h2 className="text-2xl font-bold">Welcome back, {user?.name}</h2>
                <p className="mt-2 opacity-90">
                    {nextAppointment
                        ? `You have ${appointments.length} upcoming appointment${appointments.length > 1 ? 's' : ''}.`
                        : "You have no upcoming appointments."}
                </p>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Appointments */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-800 text-lg">Upcoming Appointments</h3>
                        <Calendar className="h-5 w-5 text-teal-500" />
                    </div>

                    {appointments.length > 0 ? (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {appointments.map((appointment, index) => (
                                <div
                                    key={appointment.appointment_id || index}
                                    className="p-4 bg-teal-50 rounded-lg border border-teal-100 hover:bg-teal-100 transition cursor-pointer"
                                    onClick={() => setViewingAppointment(appointment)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-medium text-teal-900">
                                                {appointment.doctor_name || 'Doctor'}
                                            </div>
                                            <div className="text-sm text-teal-700">
                                                {appointment.specialization || 'General'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-teal-800">
                                                {new Date(appointment.scheduled_start).toLocaleDateString([], {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div className="text-xs text-teal-600 flex items-center justify-end mt-1">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(appointment.scheduled_start).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    {appointment.reason && (
                                        <div className="mt-2 text-xs text-teal-600 bg-teal-100/50 px-2 py-1 rounded">
                                            {appointment.reason}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-500 italic py-8 text-center">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                            No upcoming appointments.
                        </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <Link
                            to="/book-appointment"
                            className="flex items-center justify-center w-full py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm"
                        >
                            <Calendar className="h-4 w-4 mr-2" />
                            Book New Appointment
                        </Link>
                    </div>
                </div>

                {/* Right Column - Lab Reports & Quick Actions */}
                <div className="space-y-6">
                    {/* Lab Reports */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800 text-lg">Recent Lab Reports</h3>
                            <Beaker className="h-5 w-5 text-purple-500" />
                        </div>
                        {labReports.length > 0 ? (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto">
                                {labReports.map((report) => (
                                    <div
                                        key={report.report_id}
                                        className="p-3 bg-purple-50 rounded-md border border-purple-100 cursor-pointer hover:bg-purple-100 transition group"
                                        onClick={() => handleViewReport(report.report_id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-purple-900">{report.test_name}</div>
                                                <div className="text-xs text-purple-700 mt-1">
                                                    {new Date(report.verified_at || report.ordered_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {report.verified && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Verified
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => handleDownloadReport(e, report)}
                                                    disabled={downloadingId === report.report_id}
                                                    className="p-1 text-slate-400 hover:text-purple-600 transition-colors"
                                                    title="Download Report"
                                                >
                                                    {downloadingId === report.report_id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-slate-500 italic py-6 text-center">
                                <Beaker className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                                No lab reports available.
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <Link
                                to="/ai-bot"
                                className="flex items-center justify-between w-full p-4 text-left text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition border border-purple-100 shadow-sm"
                            >
                                <div className="flex items-center font-medium">
                                    <Sparkles className="h-5 w-5 mr-3 text-purple-500" />
                                    Launch AI Care Advisor
                                </div>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                to={`/patient/${user?.sub}/care-plan`}
                                className="flex items-center justify-between w-full p-3 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-md transition border border-slate-100 mt-2"
                            >
                                <span className="font-medium">View my Care Plan</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <button className="flex items-center justify-between w-full p-3 text-left text-sm text-slate-600 hover:bg-slate-50 rounded-md transition border border-slate-100">
                                <span>Request Prescription Refill</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeReportModal}
                title={loadingReport ? 'Loading Report...' : selectedReport?.result?.testName || 'Lab Report Details'}
            >
                {loadingReport ? (
                    <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : selectedReport ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 flex-grow mr-4">
                                <div><strong>Report ID:</strong> {selectedReport.report_id}</div>
                                <div><strong>Verified:</strong> {selectedReport.verified ? 'Yes' : 'No'}</div>
                            </div>
                            <button
                                onClick={(e) => handleDownloadReport(e, selectedReport)}
                                disabled={downloadingId === selectedReport.report_id}
                                className="flex items-center px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                            >
                                {downloadingId === selectedReport.report_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                )}
                                Download
                            </button>
                        </div>

                        <div className="space-y-2">
                            {(() => {
                                const renderRow = (key, value) => (
                                    <div key={key} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                                        <span className="text-slate-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="font-semibold text-slate-900 text-right">{value}</span>
                                    </div>
                                );

                                if (typeof selectedReport.result === 'string') {
                                    return selectedReport.result.split('\n').map((line, idx) => {
                                        const parts = line.split(':');
                                        if (parts.length >= 2) {
                                            const label = parts[0].trim();
                                            const val = parts.slice(1).join(':').trim();
                                            return renderRow(label + `_${idx}`, val);
                                        }
                                        return (
                                            <div key={idx} className="py-1 border-b border-slate-100 last:border-0 text-slate-700">
                                                {line}
                                            </div>
                                        );
                                    });
                                } else {
                                    return Object.entries(selectedReport.result || {}).map(([key, value]) => {
                                        if (key === 'testName' || key === 'comments') return null;
                                        return renderRow(key, typeof value === 'object' ? JSON.stringify(value) : value);
                                    });
                                }
                            })()}
                        </div>

                        {selectedReport.result?.comments && (
                            <div>
                                <h4 className="font-medium text-slate-900 border-b pb-1 mb-2">Lab Tech Comments</h4>
                                <p className="text-sm text-slate-600">{selectedReport.result.comments}</p>
                            </div>
                        )}

                        {selectedReport.diagnosis && (
                            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                                <h4 className="font-medium text-blue-900 border-b border-blue-200 pb-1 mb-2">Doctor's Diagnosis / Comments</h4>
                                <p className="text-sm text-blue-800">{selectedReport.diagnosis}</p>
                            </div>
                        )}

                        {selectedReport.verified && (
                            <div className="mt-4 flex items-center p-3 bg-green-50 text-green-700 rounded-md text-sm">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                <div>
                                    <span className="font-medium">Digitally Signed & Verified</span>
                                    <div className="text-xs opacity-75 mt-0.5">
                                        This report is cryptographically verified by your doctor.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : error ? (
                    <div className="text-center py-6 text-red-500">
                        {error}
                    </div>
                ) : (
                    <div className="text-center py-6 text-slate-500">
                        Failed to load report details.
                    </div>
                )}
            </Modal>

            {/* Appointment Detail Modal */}
            <Modal
                isOpen={!!viewingAppointment}
                onClose={() => setViewingAppointment(null)}
                title="Appointment Details"
            >
                {viewingAppointment && (
                    <div className="space-y-4">
                        <div className="bg-teal-50 p-4 rounded-md border border-teal-100">
                            <h4 className="font-semibold text-teal-900 text-lg">{viewingAppointment.doctor_name || 'Unknown Doctor'}</h4>
                            <div className="text-teal-700">{viewingAppointment.specialization || 'General Practice'}</div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date & Time</label>
                                <div className="text-slate-900 font-medium flex items-center mt-1">
                                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                    {new Date(viewingAppointment.scheduled_start).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 pl-6">
                                    Duration: {(new Date(viewingAppointment.scheduled_end) - new Date(viewingAppointment.scheduled_start)) / 60000} mins
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason for Visit</label>
                                <div className="text-slate-900 bg-slate-50 p-3 rounded mt-1 border border-slate-100">
                                    {viewingAppointment.reason || "No reason specified."}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                                <div className="mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                        {viewingAppointment.status || 'SCHEDULED'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default PatientDashboard;
