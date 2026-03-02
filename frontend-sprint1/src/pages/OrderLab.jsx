import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, Beaker, Search, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';

const OrderLab = () => {
    const { id } = useParams(); // Patient ID
    const navigate = useNavigate();
    const location = useLocation();
    const patientName = location.state?.patientName || `Patient #${id}`;

    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTest, setSelectedTest] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);

    useEffect(() => {
        fetchLabTests();
    }, []);

    const fetchLabTests = async () => {
        try {
            const response = await api.get('/labs/tests');
            // Assuming response.data is array of { test_id, test_name, description, category }
            setLabTests(response.data);
        } catch (error) {
            console.error("Failed to load lab tests", error);
            // Fallback for dev/demo if API fails
            setLabTests([
                { test_id: 'test_blood_cbc', test_name: 'Complete Blood Count (CBC)', description: 'Measures different parts of the blood including red and white blood cells.', category: 'Hematology' },
                { test_id: 'test_lipid_panel', test_name: 'Lipid Panel', description: 'Measures cholesterol and triglycerides to assess heart health.', category: 'Cardiology' },
                { test_id: 'test_metabolic', test_name: 'Basic Metabolic Panel', description: 'Measures sugar (glucose) level, electrolyte and fluid balance, and kidney function.', category: 'Metabolic' },
                { test_id: 'test_thyroid', test_name: 'Thyroid Function Test', description: 'Checks how well your thyroid gland is working.', category: 'Endocrinology' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleOrder = async () => {
        if (!selectedTest) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            await api.post('/labs/lab-orders', {
                patient_id: id,
                test_id: selectedTest.test_id === 'new' ? null : selectedTest.test_id,
                test_name: selectedTest.test_name
            });

            setSubmitResult({ success: true, message: `Successfully ordered ${selectedTest.test_name} for ${patientName}.` });
            setSelectedTest(null);
        } catch (err) {
            console.error("Failed to order lab test", err);
            setSubmitResult({ success: false, message: err.response?.data?.error || "Failed to submit order." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter tests
    const filteredTests = labTests.filter(test =>
        test.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.description && test.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Add "Create New" option if search term doesn't match exactly
    const exactMatch = filteredTests.some(t => t.test_name.toLowerCase() === searchTerm.trim().toLowerCase());
    if (searchTerm.trim() && !exactMatch) {
        // We'll treat this as a special category or just prepend/append it
        // For the grouped view, it's easier to add it to a "New" category or handle it in rendering
    }

    // Group by Category
    const grouped = filteredTests.reduce((acc, test) => {
        const cat = test.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(test);
        return acc;
    }, {});

    // Inject "Create New" option
    if (searchTerm.trim() && !exactMatch) {
        if (!grouped['Custom']) grouped['Custom'] = [];
        grouped['Custom'].unshift({
            test_id: 'new',
            test_name: searchTerm,
            description: 'Create a new custom lab test',
            category: 'Custom'
        });
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-sm text-slate-600 hover:text-slate-900"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </button>

            <div className="md:flex md:items-center md:justify-between border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Order Lab Test
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Select a test below to order for <span className="font-semibold text-slate-700">{patientName}</span>.
                    </p>
                </div>
            </div>

            {submitResult && (
                <div className={`rounded-md p-4 ${submitResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {submitResult.success ?
                                <CheckCircle className="h-5 w-5 text-green-400" /> :
                                <AlertCircle className="h-5 w-5 text-red-400" />
                            }
                        </div>
                        <div className="ml-3">
                            <p className={`text-sm font-medium ${submitResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {submitResult.message}
                            </p>
                        </div>
                        {submitResult.success && (
                            <div className="ml-auto pl-3">
                                <div className="-mx-1.5 -my-1.5">
                                    <button
                                        onClick={() => setSubmitResult(null)}
                                        className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
                                    >
                                        <span className="sr-only">Dismiss</span>
                                        <span className="text-sm font-medium">Order Another</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Test Catalog */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-3"
                            placeholder="Search tests by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
                            <p className="mt-2 text-sm text-slate-500">Loading test catalog...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.keys(grouped).length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No tests found matching your search.</div>
                            ) : (
                                Object.entries(grouped).map(([category, tests]) => (
                                    <div key={category} className="bg-white shadow overflow-hidden sm:rounded-md">
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{category}</h3>
                                        </div>
                                        <ul className="divide-y divide-slate-200">
                                            {tests.map((test) => (
                                                <li
                                                    key={test.test_id}
                                                    className={`hover:bg-slate-50 cursor-pointer transition ${selectedTest?.test_name === test.test_name ? 'bg-teal-50 ring-2 ring-inset ring-teal-500' : ''}`}
                                                    onClick={() => setSelectedTest(test)}
                                                >
                                                    <div className="px-4 py-4 sm:px-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-teal-600 truncate">{test.test_name}</p>
                                                                <p className="mt-1 flex items-center text-sm text-slate-500">
                                                                    <Info className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                                                    <span className="truncate">{test.description || "No description available."}</span>
                                                                </p>
                                                            </div>
                                                            <div className="ml-4 flex-shrink-0">
                                                                <div className="ml-4 flex-shrink-0">
                                                                    {selectedTest?.test_name === test.test_name && (
                                                                        <CheckCircle className="h-6 w-6 text-teal-600" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow sm:rounded-lg sticky top-6">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-slate-900">Order Summary</h3>
                            <div className="mt-4 border-t border-slate-200 pt-4">
                                <dl className="divide-y divide-slate-200">
                                    <div className="py-2 flex justify-between">
                                        <dt className="text-sm font-medium text-slate-500">Patient</dt>
                                        <dd className="text-sm text-slate-900 font-semibold text-right">{patientName}</dd>
                                    </div>
                                    <div className="py-2 flex justify-between">
                                        <dt className="text-sm font-medium text-slate-500">Selected Test</dt>
                                        <dd className="text-sm text-slate-900 text-right">
                                            {selectedTest ? selectedTest.test_name : <span className="text-slate-400 italic">None selected</span>}
                                        </dd>
                                    </div>
                                    {selectedTest && (
                                        <div className="py-2">
                                            <dt className="text-xs font-medium text-slate-500 uppercase">Description</dt>
                                            <dd className="mt-1 text-sm text-slate-600">{selectedTest.description}</dd>
                                        </div>
                                    )}
                                </dl>
                            </div>
                            <div className="mt-6">
                                <button
                                    type="button"
                                    disabled={!selectedTest || isSubmitting}
                                    onClick={handleOrder}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Beaker className="-ml-1 mr-2 h-4 w-4" />
                                            Confirm Order
                                        </>
                                    )}
                                </button>
                            </div>
                            {!selectedTest && (
                                <p className="mt-3 text-xs text-center text-slate-500">
                                    Please select a test from the catalog to proceed.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderLab;
