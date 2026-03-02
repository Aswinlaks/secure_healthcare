import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { Activity, Thermometer, Heart, Wind, Droplet, Save, CheckCircle, AlertCircle } from 'lucide-react';

const VitalsForm = ({ patientId, appointmentId, onSuccess }) => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSuccessMsg(null);

        try {
            // If we don't have an appointmentId, we might need to handle it or it's optional
            // For now, assuming vitals can be recorded against patient directly or need a mock appointment ID
            // The backend endpoint requires appointment_id usually, OR we use the patient-direct endpoint if it exists
            // Checking vitals.routes.js: POST /vitals calls controller.recordVitals
            // controller.recordVitals likely expects appointment_id. 
            // If appointmentId is missing, we might need to find the latest active appointment or pass null (if schema allows)
            // For Sprint 1, we might just pass a dummy appointment ID or rely on the caller to provide it.

            await api.post('/vitals', {
                patient_id: patientId,
                appointment_id: appointmentId, // Can be null if allowed
                ...data,
                recorded_by: 'DOCTOR' // Should be dynamic from auth context ideally, or handled by backend
            });

            setSuccessMsg("Vitals recorded successfully.");
            reset();
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error("Failed to record vitals", err);
            setSubmitError(err.response?.data?.error || "Failed to save vitals.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-slate-200 mt-6">
            <div className="px-4 py-3 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center">
                <Activity className="h-5 w-5 text-primary-600 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-slate-900">Record Vitals</h3>
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

                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Heart Rate */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 flex items-center">
                            <Heart className="h-4 w-4 mr-1 text-red-500" /> Heart Rate (bpm)
                        </label>
                        <input
                            {...register('heart_rate', { required: 'Required', min: 0, max: 300 })}
                            type="number"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                        {errors.heart_rate && <span className="text-xs text-red-600">{errors.heart_rate.message}</span>}
                    </div>

                    {/* BP Systolic */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">BP Systolic (mmHg)</label>
                        <input
                            {...register('bp_systolic', { required: 'Required', min: 0, max: 300 })}
                            type="number"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* BP Diastolic */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">BP Diastolic (mmHg)</label>
                        <input
                            {...register('bp_diastolic', { required: 'Required', min: 0, max: 200 })}
                            type="number"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Temperature */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 flex items-center">
                            <Thermometer className="h-4 w-4 mr-1 text-orange-500" /> Temperature (°C)
                        </label>
                        <input
                            {...register('temperature', { required: 'Required', min: 30, max: 45 })}
                            type="number"
                            step="0.1"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* Respiratory Rate */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 flex items-center">
                            <Wind className="h-4 w-4 mr-1 text-blue-400" /> Respiratory Rate (bpm)
                        </label>
                        <input
                            {...register('respiratory_rate', { required: 'Required', min: 0, max: 100 })}
                            type="number"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    {/* O2 Saturation */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 flex items-center">
                            <Droplet className="h-4 w-4 mr-1 text-blue-600" /> O2 Saturation (%)
                        </label>
                        <input
                            {...register('oxygen_saturation', { required: 'Required', min: 0, max: 100 })}
                            type="number"
                            className="mt-1 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>

                    <div className="md:col-span-2 lg:col-span-3">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? 'Saving...' : 'Save Vitals'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VitalsForm;
