import { useState, useEffect } from "react";
import { Users, FileText, AlertTriangle, CheckCircle, Search, Trash2, Plus } from 'lucide-react';
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        auditLogs: 0,
        systemStatus: "Compliant"
    });
    const [logs, setLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "PATIENT", // default
        full_name: "", // for patient/doctor
        dob: "",
        gender: "Male",
        blood_group: "O+",
        // Doctor fields
        specialization: "",
        qualification: "",
        experience_years: 0,
        department: "",
        consultation_fee: 0,
        phone_number: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token = localStorage.getItem('token');

    // Fetch Initial Data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // 1. Fetch Users
            const usersRes = await axios.get("http://localhost:5000/admin/users", config);
            setUsers(usersRes.data);

            // 2. Fetch Logs (Recent 5)
            const logsRes = await axios.get("http://localhost:5000/admin/audit-logs?limit=5", config);
            setLogs(logsRes.data.logs);

            // 3. Fetch Audit Summary for Total Count
            const summaryRes = await axios.get("http://localhost:5000/admin/audit-logs/summary", config);

            setStats({
                totalUsers: usersRes.data.length,
                auditLogs: summaryRes.data.total_events, // Real total from DB
                systemStatus: "Compliant"
            });

        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
            if (err.response && err.response.status === 401) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await axios.delete(`http://localhost:5000/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh
            fetchDashboardData();
            setSuccess("User deleted successfully");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Delete failed", err);
            setError("Failed to delete user");
            setTimeout(() => setError(""), 3000);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await axios.post("http://localhost:5000/admin/users", formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowModal(false);
            setFormData({
                username: "", email: "", password: "", role: "PATIENT",
                full_name: "", dob: "", gender: "Male", blood_group: "O+",
                specialization: "", qualification: "", experience_years: 0, department: "", consultation_fee: 0, phone_number: ""
            });
            setSuccess("User created successfully");
            fetchDashboardData();
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Create failed", err);
            setError(err.response?.data?.error || "Failed to create user");
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded">{success}</div>}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* Stat Cards */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">Total Users</dt>
                                    <dd className="text-lg font-medium text-slate-900">{stats.totalUsers}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <FileText className="h-6 w-6 text-slate-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">Total Audit Logs</dt>
                                    <dd className="text-lg font-medium text-slate-900">{stats.auditLogs}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 px-5 py-3">
                        <div className="text-sm">
                            <Link to="/admin/logs" className="font-medium text-teal-600 hover:text-teal-900">View logs</Link>
                        </div>
                    </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-slate-500 truncate">System Status</dt>
                                    <dd className="text-lg font-medium text-green-600">{stats.systemStatus}</dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Management Section */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Manage Users</h3>
                    <div className="flex space-x-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-3 py-1 border border-slate-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
                            />
                            <Search className="h-4 w-4 text-slate-400 absolute left-2.5 top-2" />
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none"
                        >
                            <Plus className="h-4 w-4 mr-1" /> Add User
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map((user) => (
                                <tr key={user.user_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDeleteUser(user.user_id)} className="text-red-600 hover:text-red-900">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Audit Log Table */}
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-slate-200">
                    <h3 className="text-lg leading-6 font-medium text-slate-900">Recent Audit Logs</h3>
                </div>
                <ul className="divide-y divide-slate-200">
                    {logs.map((log) => (
                        <li key={log.audit_id} className="px-4 py-4 sm:px-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertTriangle className={`h-5 w-5 mr-3 ${log.action.includes('FAIL') || log.action.includes('DENIED') ? 'text-red-500' : 'text-slate-400'}`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">
                                            {log.action}
                                        </p>
                                        <div className="flex text-xs text-slate-500 mt-0.5">
                                            <span className="mr-2">User ID: {log.actor_user_id}</span>
                                            <span>• IP: {log.ip_address}</span>
                                            <span>• Target: {log.entity_type} ({log.entity_id})</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500">
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </div>
                        </li>
                    ))}
                    {logs.length === 0 && <li className="px-4 py-4 text-sm text-gray-500">No logs found.</li>}
                </ul>
            </div>

            {/* Add User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New User</h3>
                            <form onSubmit={handleAddUser} className="mt-2 text-left">
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                                    <input required name="username" value={formData.username} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                                    <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                        <option value="PATIENT">Patient</option>
                                        <option value="DOCTOR">Doctor</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="LAB_TECH">Lab Tech</option>
                                    </select>
                                </div>
                                {
                                    /* 
                                     * Conditional Rendering for Role-Specific Fields
                                     * 
                                     * PATIENT: Needs basic biodata (DOB, Gender, etc.)
                                     * DOCTOR: Needs professional details (Specialization, License, Fees, etc.)
                                     * LAB_TECH/ADMIN: Currently standard user fields only
                                     */
                                }
                                {formData.role === 'PATIENT' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                                            <input required name="full_name" value={formData.full_name} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">DOB</label>
                                            <input required type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                        </div>

                                    </>
                                )}
                                {formData.role === 'DOCTOR' && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                                            <input required name="full_name" value={formData.full_name} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                        </div>
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Specialization</label>
                                                <input required name="specialization" value={formData.specialization} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Department</label>
                                                <input required name="department" value={formData.department} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                        </div>
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Qualification</label>
                                                <input required name="qualification" value={formData.qualification} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Experience (Years)</label>
                                                <input required type="number" name="experience_years" value={formData.experience_years} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                        </div>
                                        <div className="mb-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Consultation Fee</label>
                                                <input required type="number" name="consultation_fee" value={formData.consultation_fee} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                                                <input name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div className="flex items-center justify-between mt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Cancel</button>
                                    <button type="submit" className="bg-teal-600 hover:bg-teal-800 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default AdminDashboard;
