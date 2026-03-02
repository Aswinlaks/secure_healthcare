import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { FileText, Clock, User, CheckCircle, Loader2 } from 'lucide-react';

const LabTechDashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [resultValues, setResultValues] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await api.get('/labs/pending-orders');
            setOrders(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch lab orders", err);
            setError("Could not load pending orders.");
            setLoading(false);
        }
    };

    const handleUploadDefault = (order) => {
        setSelectedOrder(order);
        setResultValues('');
    };

    const submitUpload = async (e) => {
        e.preventDefault();
        if (!resultValues.trim()) return;

        setIsUploading(true);
        try {
            await api.post('/labs/reports', {
                order_id: selectedOrder.order_id,
                result_values: resultValues
            });

            // Success
            setSelectedOrder(null);
            fetchOrders(); // Refresh list
        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload report: " + (err.response?.data?.error || err.message));
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 p-8">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6 relative">
            <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Lab Technician Dashboard
                    </h2>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="bg-white px-4 py-5 border-b border-slate-200 sm:px-6 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center">
                        <FileText className="h-5 w-5 text-teal-600 mr-2" />
                        Pending Lab Orders
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {orders.length} Pending
                    </span>
                </div>

                <ul className="divide-y divide-slate-200">
                    {orders.length === 0 ? (
                        <li className="px-4 py-8 text-center text-slate-500">
                            No pending lab orders found.
                        </li>
                    ) : (
                        orders.map((order) => (
                            <li key={order.order_id}>
                                <div className="block hover:bg-slate-50">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <p className="text-sm font-medium text-teal-600 truncate">
                                                    {order.test_name || "Unknown Test"}
                                                </p>
                                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-slate-100 text-slate-800">
                                                    {new Date(order.ordered_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-slate-500">
                                                    <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                    {/* We only have ID or encrypted name here usually, relying on backend join */}
                                                    Patient ID: {order.patient_id}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                                                <button
                                                    onClick={() => handleUploadDefault(order)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                                                >
                                                    Upload Results
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            {/* Upload Modal */}
            {selectedOrder && (
                <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedOrder(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div>
                                <div className="mt-3 text-center sm:mt-5">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Upload Lab Results
                                    </h3>
                                    <div className="mt-2 text-sm text-gray-500 text-left bg-gray-50 p-3 rounded">
                                        <p><strong>Test:</strong> {selectedOrder.test_name}</p>
                                        <p><strong>Patient ID:</strong> {selectedOrder.patient_id}</p>
                                    </div>
                                    <div className="mt-4">
                                        <textarea
                                            rows={6}
                                            className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md p-2"
                                            placeholder="Enter detailed lab results here..."
                                            value={resultValues}
                                            onChange={(e) => setResultValues(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                                    onClick={submitUpload}
                                    disabled={isUploading || !resultValues.trim()}
                                >
                                    {isUploading ? 'Uploading...' : 'Submit Report'}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={() => setSelectedOrder(null)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LabTechDashboard;
