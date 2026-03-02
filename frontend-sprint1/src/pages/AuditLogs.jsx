import { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, AlertTriangle, ArrowLeft } from "lucide-react";

const AuditLogs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [limit] = useState(20);
    const [total, setTotal] = useState(0);
    const [error, setError] = useState("");

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        setError("");
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const offset = page * limit;
            const res = await axios.get(`http://localhost:5000/admin/audit-logs?limit=${limit}&offset=${offset}`, config);

            setLogs(res.data.logs);
            setTotal(res.data.count);
        } catch (err) {
            console.error("Failed to fetch logs", err);
            setError("Failed to load audit logs");
            if (err.response && err.response.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Security Audit Logs</h1>
                    <p className="text-gray-500 text-sm mt-1">Full history of system activities and security events.</p>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} events
                    </div>
                    {/* Pagination Controls */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className={`p-2 rounded-md ${page === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                            className={`p-2 rounded-md ${page >= totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-gray-500">Loading logs...</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500">{error}</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {logs.map((log) => (
                                <tr key={log.audit_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 flex items-center">
                                        <AlertTriangle className={`h-4 w-4 mr-2 ${log.action.includes('FAIL') || log.action.includes('DENIED') ? 'text-red-500' : 'text-gray-400'}`} />
                                        {log.action}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{log.actor_user_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{log.entity_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{log.entity_id || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{log.ip_address}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
