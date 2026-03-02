import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { User, Activity, Calendar, ChevronRight, AlertTriangle, Beaker, FileCheck, CheckCircle, Loader2, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import AdminDashboard from './dashboards/AdminDashboard';
import PatientDashboard from './dashboards/PatientDashboard';
import NurseDashboard from './dashboards/NurseDashboard';
import LabTechDashboard from './dashboards/LabTechDashboard';
import Modal from '../components/Modal';

const Dashboard = () => {
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [labReports, setLabReports] = useState([]);
    const [verifyingId, setVerifyingId] = useState(null);
    const [reportMsg, setReportMsg] = useState(null);

    // Diagnosis Modal State
    const [diagnosisModal, setDiagnosisModal] = useState({ isOpen: false, reportId: null });
    const [diagnosisText, setDiagnosisText] = useState("");

    const navigate = useNavigate();

    // ROLE SWITCHER
    const role = user?.role?.toUpperCase();
    if (role === 'ADMIN') return <AdminDashboard />;
    if (role === 'PATIENT') return <PatientDashboard />;
    if (role === 'NURSE') return <NurseDashboard />;
    if (role === 'LAB_TECH') return <LabTechDashboard />;

    useEffect(() => {
        if (user?.role?.toUpperCase() === 'DOCTOR') {
            fetchPatients();
            fetchLabReports();

        } else {
            setLoading(false);
        }
    }, [user]);

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const diff = Date.now() - birthDate.getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const fetchPatients = async () => {
        try {
            const response = await api.get('/appointments/doctor');
            // Map appointments to patient view
            const data = response.data.map(appt => ({
                id: appt.patient_id,
                name: appt.patient_name || 'Unknown Patient',
                age: calculateAge(appt.date_of_birth),
                date: new Date(appt.scheduled_start).toLocaleDateString(),
                time: new Date(appt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: appt.status // e.g. SCHEDULED
            }));
            setPatients(data);
        } catch (err) {
            console.error("Failed to fetch patients", err);
            setError("Could not load patient list.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLabReports = async () => {
        try {
            const response = await api.get('/labs/doctor-reports');
            setLabReports(response.data);
        } catch (err) {
            console.error("Failed to fetch lab reports", err);
        }
    };

    const openVerifyModal = (reportId) => {
        setDiagnosisModal({ isOpen: true, reportId });
        setDiagnosisText("");
    };

    const handleVerifyReport = async () => {
        const reportId = diagnosisModal.reportId;
        if (!reportId) return;

        setVerifyingId(reportId);
        setReportMsg(null);
        setDiagnosisModal({ isOpen: false, reportId: null }); // Close modal immediately

        try {
            await api.patch(`/labs/reports/${reportId}/verify`, { diagnosis: diagnosisText });
            setReportMsg({ type: 'success', text: 'Report verified and signed successfully.' });
            fetchLabReports(); // Refresh list
        } catch (err) {
            console.error("Verification failed", err);
            setReportMsg({ type: 'error', text: err.response?.data?.error || 'Verification failed.' });
        } finally {
            setVerifyingId(null);
            // Clear message after 3 seconds
            setTimeout(() => setReportMsg(null), 3000);
        }
    };




    return (
        <div className="space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Doctor Dashboard
                    </h2>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Link
                        to="/doctor/availability"
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Clock className="-ml-1 mr-2 h-5 w-5" />
                        Manage Availability
                    </Link>
                </div>
            </div>

            {/* PENDING VERIFICATIONS SECTION */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
                <div className="bg-white px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center">
                        <FileCheck className="h-5 w-5 text-indigo-600 mr-2" />
                        Pending Lab Verifications
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {labReports.filter(r => !r.verified).length} Pending
                    </span>
                </div>

                {reportMsg && (
                    <div className={`px-4 py-3 text-sm ${reportMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {reportMsg.text}
                    </div>
                )}

                <ul className="divide-y divide-slate-200">
                    {labReports.filter(r => !r.verified).length === 0 ? (
                        <li className="px-4 py-5 text-sm text-slate-500 text-center">
                            No pending reports to verify.
                        </li>
                    ) : (
                        labReports.filter(r => !r.verified).map((report) => (
                            <li key={report.report_id} className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition duration-150 ease-in-out">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className="text-sm font-medium text-purple-600 truncate">{report.test_name}</div>
                                        <div className="text-sm text-slate-500">
                                            Patient ID: {report.patient_id}
                                            {/* Note: In a real app we'd map ID to Name or fetch it. The query returns patient_name_encrypted but we might not have the key here easily. 
                                                However, getDoctorLabReports controller DOES return patient_name_encrypted. 
                                                If we want names, we rely on the backend decrypting or mapped contexts. 
                                                For now, displaying ID is safer if we can't easily decrypt on frontend list view. 
                                                Actually, let's see if we can match it with the `patients` state list which has names! 
                                            */}
                                            {patients.find(p => p.id === report.patient_id)?.name &&
                                                ` - ${patients.find(p => p.id === report.patient_id)?.name}`
                                            }
                                        </div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            Ordered: {new Date(report.ordered_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div>
                                        <button
                                            onClick={() => openVerifyModal(report.report_id)}
                                            disabled={verifyingId === report.report_id}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                        >
                                            {verifyingId === report.report_id ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" /> Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-3 w-3 mr-1" /> Verify & Sign
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>


            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="bg-white px-4 py-5 border-b border-slate-200 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Patient List</h3>
                </div>
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading patients...</div>
                ) : error ? (
                    <div className="p-6 text-center text-red-500">{error}</div>
                ) : (
                    <ul className="divide-y divide-slate-200">
                        {patients.map((patient) => (
                            <li key={patient.id}>
                                <div className="w-full text-left bg-white hover:bg-slate-50 transition duration-150 ease-in-out border border-transparent">
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        {/* Clickable Patient Info Area */}
                                        <div
                                            className="flex items-center cursor-pointer flex-grow"
                                            onClick={() => navigate(`/patient/${patient.id}/diagnosis`)}
                                        >
                                            <div className="flex-shrink-0">
                                                <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                                                    <span className="font-medium leading-none text-primary-700">{patient.name.charAt(0)}</span>
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-primary-600 truncate">{patient.name}</div>
                                                <div className="flex items-center text-sm text-slate-500">
                                                    <span className="truncate">Age: {patient.age}</span>
                                                    <Calendar className="flex-shrink-0 ml-3 mr-1.5 h-4 w-4 text-slate-400" />
                                                    <span className="truncate">{patient.date} {patient.time}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons Area - Separate from click target */}
                                        <div className="flex items-center space-x-4 ml-4 z-10">
                                            <Link
                                                to={`/patient/${patient.id}/order-lab`}
                                                state={{ patientName: patient.name }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 relative z-20"
                                            >
                                                <Beaker className="h-4 w-4 text-purple-600 mr-1" />
                                                Order Lab
                                            </Link>

                                            <div className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.status === 'Critical' ? 'bg-red-100 text-red-800' :
                                                patient.status === 'Stable' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {patient.status}
                                            </div>
                                            <div
                                                className="cursor-pointer p-1"
                                                onClick={() => navigate(`/patient/${patient.id}/diagnosis`)}
                                            >
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            {/* Diagnosis Modal */}
            <Modal
                isOpen={diagnosisModal.isOpen}
                onClose={() => setDiagnosisModal({ isOpen: false, reportId: null })}
                title="Verify Lab Report & Add Diagnosis"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        Please review the lab results. You can add a diagnosis or comments before digitally signing this report.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis / Comments</label>
                        <textarea
                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            rows={4}
                            placeholder="Enter diagnosis or interpretation of results..."
                            value={diagnosisText}
                            onChange={(e) => setDiagnosisText(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button
                            type="button"
                            className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => setDiagnosisModal({ isOpen: false, reportId: null })}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                            onClick={handleVerifyReport}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Sign & Verify
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;
