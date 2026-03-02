import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2, Activity, User, KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';

const Login = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Steps: 'CREDENTIALS', 'OTP'
    const [step, setStep] = useState('CREDENTIALS');
    const [username, setUsername] = useState('');

    // OTP State
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const { login, verifyLoginOtp, resendOtp } = useAuth();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

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

    const onSubmit = async (data) => {
        setError('');
        setIsLoading(true);

        try {
            const result = await login(data.username, data.password);
            if (result.success && result.status === 'OTP_SENT') {
                setUsername(data.username);
                setStep('OTP');
                setTimer(30);
                setCanResend(false);
                setCanResend(false);
            } else if (result.success) {
                // REDIRECT BASED ON ROLE (Non-MFA case if any)
                const role = result.role?.toUpperCase() || '';
                if (role === 'PATIENT') {
                    navigate('/dashboard', { replace: true });
                } else {
                    navigate(from === '/login' ? '/dashboard' : from, { replace: true });
                }
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            setError('Please enter a valid OTP.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const result = await verifyLoginOtp(username, otp);
            if (result.success) {
                // REDIRECT BASED ON ROLE
                const role = result.role?.toUpperCase() || '';
                if (role === 'PATIENT') {
                    navigate('/dashboard', { replace: true });
                } else if (role === 'DOCTOR') {
                    navigate('/dashboard', { replace: true }); // or doctor-dashboard if separate
                } else {
                    // Default / Fallback
                    navigate(from === '/login' ? '/dashboard' : from, { replace: true });
                }
            } else {
                setError(result.message || 'Invalid OTP');
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!canResend) return;
        setCanResend(false);
        setTimer(30);
        setError('');
        try {
            const result = await resendOtp(username);
            if (!result.success) {
                setError(result.message);
            }
        } catch (err) {
            setError('Failed to resend OTP');
        }
    };

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
                        Next Generation Healthcare Management
                    </h1>
                    <p className="mt-6 text-lg text-slate-300 max-w-md">
                        Secure, compliant, and efficient patient data management for modern medical facilities.
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

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:px-24 bg-white">
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
                            {step === 'CREDENTIALS' ? 'Welcome back' : 'Verify Identity'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {step === 'CREDENTIALS'
                                ? 'Please enter your details to sign in.'
                                : `Enter the OTP sent to your registered email`
                            }
                        </p>
                    </div>

                    <div className="mt-8">
                        {step === 'CREDENTIALS' && (
                            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                                        Username
                                    </label>
                                    <div className="mt-1 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            id="username"
                                            {...register('username', {
                                                required: 'Username is required'
                                            })}
                                            type="text"
                                            autoComplete="off"
                                            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${errors.username ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                            placeholder="Enter your username"
                                        />
                                    </div>
                                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                                </div>

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
                                            {...register('password', { required: 'Password is required' })}
                                            type="password"
                                            autoComplete="off"
                                            className={`appearance-none block w-full pl-10 pr-3 py-3 border ${errors.password ? 'border-red-300' : 'border-slate-300'} rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-all`}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                                        />
                                        <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                                            Remember me
                                        </label>
                                    </div>

                                    <div className="text-sm">
                                        <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                                            Forgot password?
                                        </a>
                                    </div>
                                </div>

                                {error && (
                                    <div className="rounded-lg bg-red-50 p-4 border border-red-100">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
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
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Continue'
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
                                        disabled={isLoading || otp.length < 4}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify & Sign In'
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
                                    <button onClick={() => setStep('CREDENTIALS')} className="text-sm text-slate-500 hover:text-slate-700">
                                        Back to Login
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
                                        Don't have an account?
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Link to="/register" className="font-medium text-teal-600 hover:text-teal-500 hover:underline">
                                    Create an account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
