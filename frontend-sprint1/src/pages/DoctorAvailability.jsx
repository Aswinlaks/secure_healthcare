import { useState, useEffect } from 'react';
import api from '../api/client';
import { Save, Clock, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const DAYS = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 0, name: 'Sunday' }
];

const DoctorAvailability = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const response = await api.get('/appointments/availability');
            // Merge with default days structure
            const fetchedSchedule = response.data;

            const mergedSchedule = DAYS.map(day => {
                const existing = fetchedSchedule.find(s => s.day_of_week === day.id);
                return {
                    dayOfWeek: day.id,
                    dayName: day.name,
                    startTime: existing?.start_time || '09:00:00',
                    endTime: existing?.end_time || '17:00:00',
                    isActive: existing ? existing.is_active : false
                };
            });

            setSchedule(mergedSchedule);
        } catch (err) {
            console.error("Failed to fetch availability", err);
            setMessage({ type: 'error', text: 'Could not load current availability.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (dayId, field, value) => {
        setSchedule(prev => prev.map(item =>
            item.dayOfWeek === dayId ? { ...item, [field]: value } : item
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Format for backend: HH:MM:SS
            const payload = schedule.map(item => ({
                dayOfWeek: item.dayOfWeek,
                startTime: item.startTime.length === 5 ? `${item.startTime}:00` : item.startTime,
                endTime: item.endTime.length === 5 ? `${item.endTime}:00` : item.endTime,
                isActive: item.isActive
            }));

            await api.post('/appointments/availability', payload);
            setMessage({ type: 'success', text: 'Availability updated successfully.' });
        } catch (err) {
            console.error("Failed to save availability", err);
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save changes.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading availability...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
                        Manage Availability
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Set your weekly working hours. Patients can only book appointments within these times.
                    </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : (
                            <>
                                <Save className="-ml-1 mr-2 h-5 w-5" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} flex items-center`}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                    {message.text}
                </div>
            )}

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-slate-200">
                    {schedule.map((day) => (
                        <li key={day.dayOfWeek} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 flex-1">
                                    <div className="flex-shrink-0">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${day.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="flex items-center">
                                            <label className="text-sm font-medium text-slate-900 w-24">
                                                {day.dayName}
                                            </label>
                                            <label className="inline-flex items-center cursor-pointer ml-4">
                                                <input
                                                    type="checkbox"
                                                    checked={day.isActive}
                                                    onChange={(e) => handleChange(day.dayOfWeek, 'isActive', e.target.checked)}
                                                    className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                                                />
                                                <span className="ml-2 text-sm text-slate-500">
                                                    {day.isActive ? 'Available' : 'Unavailable'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col">
                                        <label className="text-xs text-slate-500 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            value={day.startTime.slice(0, 5)}
                                            onChange={(e) => handleChange(day.dayOfWeek, 'startTime', e.target.value)}
                                            disabled={!day.isActive}
                                            className="block w-full sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs text-slate-500 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            value={day.endTime.slice(0, 5)}
                                            onChange={(e) => handleChange(day.dayOfWeek, 'endTime', e.target.value)}
                                            disabled={!day.isActive}
                                            className="block w-full sm:text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DoctorAvailability;
