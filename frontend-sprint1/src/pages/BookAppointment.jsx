import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { FaCalendarAlt, FaCheckCircle, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion';

const BookAppointment = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctors, setDoctors] = useState([]);

    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        age: '',
        doctorSpecialization: '', // Storing specialty
        doctorId: '', // NEW: Storing selected doctor ID explicitly
        doctorName: '', // Storing doctor name
        appointmentDate: '',
        appointmentTime: '',
        appointmentType: '',
        symptoms: '',
        captchaInput: ''
    });

    const [captcha, setCaptcha] = useState({ code: '' });
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    // Generate Captcha
    const generateCaptcha = () => {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        setCaptcha({ code: result });
    };

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                // Get Token
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                // Get User (Try context/storage)
                // Fallback to minimal object if parsing fails
                let storedUser = { name: 'Patient', email: '', role: 'Patient' };
                try {
                    const saved = localStorage.getItem('user');
                    if (saved) storedUser = JSON.parse(saved);
                } catch (e) {
                    console.log("Error parsing user from storage");
                }

                setUser(storedUser);
                setFormData(prev => ({ ...prev, fullName: storedUser.name || '', email: storedUser.email || '' }));

                // Fetch Doctors - Real Endpoint now!
                try {
                    const docRes = await api.get('/doctors');
                    setDoctors(docRes.data);
                } catch (e) {
                    console.error("Failed to fetch doctors", e);
                    setDoctors([]); // No mock data
                }

                generateCaptcha();
            } catch (err) {
                console.error("Init Error", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [navigate]);

    const handleDoctorChange = (e) => {
        const selectedId = e.target.value;
        const doctor = doctors.find(d => d.doctor_id === selectedId);

        if (doctor) {
            setFormData(prev => ({
                ...prev,
                doctorId: selectedId,
                doctorName: doctor.full_name,
                doctorSpecialization: doctor.specialization
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                doctorId: '',
                doctorName: '',
                doctorSpecialization: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus({ type: '', message: '' });

        if (formData.captchaInput.toUpperCase() !== captcha.code) {
            setSubmitStatus({ type: 'error', message: 'Incorrect CAPTCHA. Please try again.' });
            generateCaptcha();
            return;
        }

        try {
            await api.post('/appointments', {
                userId: user?.user_id, // Ensure optional chaining
                patient_id: user?.patient_id, // If available
                // Backend expects specific fields
                doctor_id: formData.doctorId, // Prefer ID if backend supports it (I updated backend to support it? Wait, I need to check.)
                doctorName: formData.doctorName, // Fallback for backend lookup by name

                // Adapting to what backend likely expects based on my review
                // bookAppointment in service expects: doctor_name (or doctor_id if I updated it)
                // Let's send BOTH names map to what backend expects.
                doctor_name: formData.doctorName,
                scheduled_start: `${formData.appointmentDate}T${formData.appointmentTime}:00`,
                scheduled_end: calculateEndTime(formData.appointmentDate, formData.appointmentTime),
                reason: `${formData.appointmentType}: ${formData.symptoms}`
            });

            setSubmitStatus({ type: 'success', message: 'Appointment booked successfully!' });
            generateCaptcha();
            // Reset form details
            setFormData(prev => ({ ...prev, appointmentDate: '', appointmentTime: '', captchaInput: '', symptoms: '' }));

            // Optional: Redirect after delay
            setTimeout(() => navigate('/dashboard'), 2000);

        } catch (err) {
            console.error("Booking Error", err);
            setSubmitStatus({ type: 'error', message: err.response?.data?.error || err.response?.data?.message || 'Booking Failed.' });
        }
    };

    const calculateEndTime = (date, time) => {
        // Simple 30 min duration
        // logic to add 30 mins to time string
        const [h, m] = time.split(':').map(Number);
        const dateObj = new Date(date);
        dateObj.setHours(h, m + 30);
        // Return ISO string or similar? backend expects ISO mostly?
        // Service expects: scheduled_end
        // Service code: const start = new Date(scheduled_start); const end = new Date(scheduled_end);
        // So ISO string works better.

        const startObj = new Date(`${date}T${time}:00`);
        const endObj = new Date(startObj.getTime() + 30 * 60000);

        // Format to ISO string but local time consideration might be tricky without timezone.
        // Let's send what Date.toISOString/toLocaleString returns or simplistic format
        // The backend slices: scheduled_start.slice(11, 19). It expects standard ISO-like string.

        // Helper to format: YYYY-MM-DDTHH:mm:ss
        const format = (d) => {
            const pad = (n) => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
        };
        return format(endObj);
    };

    if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-teal-600"><div className="animate-spin text-4xl">⟳</div></div>;

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex justify-between items-center text-slate-800 mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-bold text-teal-700">Book Appointment</h1>
                        <p className="text-slate-500 text-sm">Schedule a visit with our specialists</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="text-slate-500 hover:text-teal-600 font-medium transition">
                        Back to Dashboard
                    </button>
                </div>

                {/* Booking Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-xl shadow-xl p-8 border-t-4 border-teal-500"
                >
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <FaCalendarAlt className="text-2xl text-teal-500" />
                        <h2 className="text-2xl font-bold text-slate-800">New Appointment</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Full Name *">
                                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="form-input w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="John Doe" required />
                            </InputGroup>
                            <InputGroup label="Email Address *">
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="form-input w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="john@example.com" required />
                            </InputGroup>
                        </div>

                        {/* Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Phone Number *">
                                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="form-input w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="+1 234 567 890" required />
                            </InputGroup>
                            <InputGroup label="Age *">
                                <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="form-input w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="25" required />
                            </InputGroup>
                        </div>

                        {/* Doctor */}
                        <InputGroup label="Select Doctor *">
                            <select value={formData.doctorId} onChange={handleDoctorChange} className="form-select w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white" required>
                                <option value="">Choose a Specialist</option>
                                {doctors.map(d => (
                                    <option key={d.doctor_id} value={d.doctor_id}>
                                        {d.full_name} ({d.specialization})
                                    </option>
                                ))}
                            </select>
                        </InputGroup>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Appointment Date *">
                                <input type="date" value={formData.appointmentDate} onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })} className="form-input w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition text-slate-600" required />
                            </InputGroup>
                            <InputGroup label="Appointment Time *">
                                <select value={formData.appointmentTime} onChange={e => setFormData({ ...formData, appointmentTime: e.target.value })} className="form-select w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white" required>
                                    <option value="">Select Time</option>
                                    {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'].map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </InputGroup>
                        </div>

                        {/* Type */}
                        <InputGroup label="Appointment Type *">
                            <select value={formData.appointmentType} onChange={e => setFormData({ ...formData, appointmentType: e.target.value })} className="form-select w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white" required>
                                <option value="">Select Appointment Type</option>
                                <option value="First Consultation">First Consultation</option>
                                <option value="Regular Check-up">Regular Check-up</option>
                                <option value="Follow-up Visit">Follow-up Visit</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </InputGroup>

                        {/* Notes */}
                        <InputGroup label="Additional Notes / Symptoms">
                            <textarea value={formData.symptoms} onChange={e => setFormData({ ...formData, symptoms: e.target.value })} className="form-input w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition min-h-[100px]" placeholder="Describe your symptoms..."></textarea>
                        </InputGroup>

                        {/* Captcha */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Verify CAPTCHA *</label>
                            <div className="flex gap-4 mb-3 items-center">
                                <div className="bg-white px-6 py-2 rounded-lg border border-slate-300 text-xl font-mono tracking-widest text-slate-600 line-through select-none font-bold shadow-sm">
                                    {captcha.code}
                                </div>
                                <button type="button" onClick={generateCaptcha} className="bg-teal-100 text-teal-600 p-2 rounded-lg hover:bg-teal-200 transition"><FaSync /></button>
                            </div>
                            <input type="text" value={formData.captchaInput} onChange={e => setFormData({ ...formData, captchaInput: e.target.value })} className="form-input w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="Enter CAPTCHA code" required />
                        </div>

                        {/* Submit */}
                        {submitStatus.message && (
                            <div className={`p-4 rounded-lg text-center font-bold ${submitStatus.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                {submitStatus.message}
                            </div>
                        )}

                        <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1">
                            <FaCheckCircle /> Confirm Booking
                        </button>

                    </form>
                </motion.div>

            </div>
        </div>
    );
};

const InputGroup = ({ label, children }) => (
    <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-600">{label}</label>
        {children}
    </div>
);

export default BookAppointment;
