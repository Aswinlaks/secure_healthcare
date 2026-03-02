import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet } from 'react-router-dom';
import { LogOut, User, ShieldCheck } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <ShieldCheck className="h-8 w-8 text-primary-600" />
                            <span className="ml-2 text-xl font-bold text-slate-900">Secure Health</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                <User className="h-4 w-4 mr-2" />
                                <span className="font-medium">{user?.role}</span>
                                <span className="mx-2">|</span>
                                <span>{user?.email || 'User'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 border-slate-300"
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
