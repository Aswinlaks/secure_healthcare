import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { Beaker, Search, PlusCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const LabOrderForm = ({ patientId, onSuccess }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [labTests, setLabTests] = useState([]);
    const [loadingTests, setLoadingTests] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    useEffect(() => {
        fetchLabTests();
    }, []);

    const fetchLabTests = async () => {
        try {
            const response = await api.get('/labs/tests');
            setLabTests(response.data);
        } catch (error) {
            console.error("Failed to load lab tests", error);
            // Fallback for simple testing if API fails or empty
            setLabTests([
                { test_id: 'test_blood_cbc', test_name: 'Complete Blood Count (CBC)' },
                { test_id: 'test_lipid_panel', test_name: 'Lipid Panel' },
                { test_id: 'test_metabolic', test_name: 'Basic Metabolic Panel' },
                { test_id: 'test_thyroid', test_name: 'Thyroid Function Test' }
            ]);
        } finally {
            setLoadingTests(false);
        }
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSuccessMsg(null);

        try {
            await api.post('/labs/lab-orders', {
                patient_id: patientId,
                test_id: data.test_id
            });

            setSuccessMsg("Lab test ordered successfully.");
            reset();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Failed to order lab test", err);
            setSubmitError(err.response?.data?.error || "Failed to order lab test.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-slate-200 mt-6">
            <div className="px-4 py-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center">
                <Beaker className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-slate-900">Order Lab Tests</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
                {successMsg && (
                    <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-md flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {successMsg}
                    </div>
                )}
                {submitError && (
                    <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {submitError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select Lab Test</label>
                        {loadingTests ? (
                            <div className="flex items-center text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading tests...
                            </div>
                        ) : (
                            <select
                                {...register('test_id', { required: 'Please select a test' })}
                                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                                <option value="">-- Select a test --</option>
                                {labTests.map(test => (
                                    <option key={test.test_id} value={test.test_id}>
                                        {test.test_name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.test_id && <span className="text-xs text-red-600">{errors.test_id.message}</span>}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || loadingTests}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Ordering...' : 'Order Test'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabOrderForm;
