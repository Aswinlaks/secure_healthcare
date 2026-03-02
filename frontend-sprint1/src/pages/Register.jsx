import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2, Activity, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';

const Register = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Steps: 'DETAILS', 'OTP', 'SUCCESS'
    const [step, setStep] = useState('DETAILS');
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [registeredPassword, setRegisteredPassword] = useState('');

    // OTP State
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const { register: registerAction, activateAccount, resendOtp } = useAuth();
    const navigate = useNavigate();

    // Timer logic for Resend OTP
    useEffect(() => {
        let interval;
        if (step === 'OTP' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const onRegisterSubmit = async (data) => {
        setError('');
        setIsSubmitting(true);

        try {
            const result = await registerAction(data);
            if (result.success) {
                setRegisteredEmail(data.email);
                setRegisteredPassword(data.password);
                setStep('OTP');
                setTimer(30);
                setCanResend(false);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setError('Please enter a valid OTP.');
            return;
        }
        setError('');
        setIsSubmitting(true);

        try {
            const result = await activateAccount(registeredEmail, otp, registeredPassword);
            if (result.success) {
                setStep('SUCCESS');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setCanResend(false);
        setTimer(30);
        setError('');
        try {
            const result = await resendOtp(registeredEmail);
            if (!result.success) {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to resend OTP');
        }
    };

    if (step === 'SUCCESS') {
        return (
            <div className="min-h-screen flex bg-white">
                {/* Left Side - Visual / Brand */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-blue-600/20 z-10" />
                    <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
                    <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />

                    <div className="relative z-20 flex flex-col justify-center px-12 text-white">
                        <div className="mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-teal-500 rounded-lg">
                                    <Activity className="h-8 w-8 text-white" />
                                </div>
                                <span className="text-3xl font-bold tracking-tight">SecureMed</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold max-w-lg leading-tight">
                            Welcome to the Future of Healthcare
                        </h1>
                        <p className="mt-6 text-lg text-slate-300 max-w-md">
                            Join thousands of patients managing their health securely and efficiently.
                        </p>
                    </div>
                </div>

                {/* Right Side - Success Message */}
                <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:px-24 bg-white">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        <div className="bg-white py-8 px-4 text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <UserPlus className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">Account Verified!</h3>
                            <p className="mt-3 text-sm text-slate-500">
                                Your email has been verified successfully. Redirecting to login...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side - Visual / Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-blue-600/20 z-10" />
                {/* Abstract decorative circles */}
                <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />

                <div className="relative z-20 flex flex-col justify-center px-12 text-white">
                    <div className="mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-teal-500 rounded-lg">
                                <Activity className="h-8 w-8 text-white" />
                            </div>
                            <span className="text-3xl font-bold tracking-tight">SecureMed</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold max-w-lg leading-tight">
                        Join the Next Generation of Healthcare
                    </h1>
                    <p className="mt-6 text-lg text-slate-300 max-w-md">
                        Create your account to access secure, compliant, and efficient health management.
                    </p>

                    {/* Mock Dashboard Visual Element */}
                    <div className="mt-12 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 max-w-md shadow-2xl">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="h-10 w-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                                <User className="h-5 w-5 text-teal-400" />
                            </div>
                            <div>
                                <div className="h-2 w-24 bg-white/20 rounded mb-2" />
                                <div className="h-2 w-16 bg-white/10 rounded" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-2 w-full bg-white/5 rounded" />
                            <div className="h-2 w-3/4 bg-white/5 rounded" />
                            <div className="h-2 w-5/6 bg-white/5 rounded" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:px-24 bg-white overflow-y-auto">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div className="lg:hidden text-center mb-8">
                        <div className="flex justify-center mb-2">
                            <div className="p-2 bg-teal-500 rounded-lg">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">SecureMed</h2>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                            {step === 'DETAILS' ? 'Create an account' : 'Verify your email'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {step === 'DETAILS'
                                ? 'Join the Secure Health System today.'
                                : `Enter the OTP sent to ${registeredEmail}`
                            }
                        </p>
                    </div>

                    <div className="mt-8">
                        {step === 'DETAILS' && (
                            <form className="space-y-5" onSubmit={handleSubmit(onRegisterSubmit)}>
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                                        Full Name
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="name"
                                            {...register('name', { required: 'Full Name is required' })}
                                            type="text"
                                            autoComplete="off"
                                            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${errors.name ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label htmlFor="dob" className="block text-sm font-medium text-slate-700">
                                        Date of Birth
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="dob"
                                            {...register('dob', { required: 'Date of Birth is required' })}
                                            type="date"
                                            className={`appearance-none block w-full px-3 py-3 border ${errors.dob ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                        />
                                    </div>
                                    {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Gender */}
                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-slate-700">
                                            Gender
                                        </label>
                                        <select
                                            id="gender"
                                            {...register('gender', { required: 'Gender is required' })}
                                            className={`mt-1 block w-full px-3 py-3 border ${errors.gender ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                        >
                                            <option value="">Select</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                                    </div>

                                    {/* Blood Group */}
                                    <div>
                                        <label htmlFor="blood_group" className="block text-sm font-medium text-slate-700">
                                            Blood Group
                                        </label>
                                        <select
                                            id="blood_group"
                                            {...register('blood_group', { required: 'Blood Group is required' })}
                                            className={`mt-1 block w-full px-3 py-3 border ${errors.blood_group ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                        >
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                        </select>
                                        {errors.blood_group && <p className="mt-1 text-sm text-red-600">{errors.blood_group.message}</p>}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                        Email address
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="email"
                                            {...register('email', {
                                                required: 'Email is required',
                                                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                                            })}
                                            type="email"
                                            autoComplete="off"
                                            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                        Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="password"
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: { value: 6, message: 'Must be at least 6 characters' }
                                            })}
                                            type="password"
                                            autoComplete="off"
                                            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${errors.password ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                                </div>

                                {/* Role Selection (hidden since only Patient) */}
                                <input type="hidden" {...register('role')} value="Patient" />

                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">Registration Failed</h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <p>{error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                                Creating Account...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 'OTP' && (
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                                        One-Time Password
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <KeyRound className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            id="otp"
                                            className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-center tracking-widest text-lg"
                                            placeholder="123456"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 text-center">
                                        Enter the 6-digit code we sent you.
                                    </p>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                                <div className="mt-2 text-sm text-red-700">
                                                    <p>{error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <button
                                        onClick={handleVerifyOtp}
                                        disabled={isSubmitting || otp.length < 4}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify & Continue'
                                        )}
                                    </button>
                                </div>

                                <div className="mt-4 text-center">
                                    <button
                                        onClick={handleResendOtp}
                                        disabled={!canResend}
                                        className={`text-sm font-medium ${canResend ? 'text-teal-600 hover:text-teal-500' : 'text-slate-400 cursor-not-allowed'}`}
                                    >
                                        {canResend ? "Resend OTP" : `Resend OTP in ${timer}s`}
                                    </button>
                                </div>

                                <div className="mt-4 text-center">
                                    <button onClick={() => setStep('DETAILS')} className="text-sm text-slate-500 hover:text-slate-700">
                                        Back to Registration
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-slate-500">
                                        Already have an account?
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 hover:underline">
                                    Sign in instead
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
