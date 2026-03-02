import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Stethoscope,
    ClipboardList,
    ShieldAlert,
    Users,
    Activity,
    FileText,
    Settings,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Navigation Items Definition
    const navItems = {
        Doctor: [
            { name: 'Patient Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'My Patients', path: '/patients', icon: Users }, // Placeholder
            { name: 'Diagnosis & EHR', path: '/ehr', icon: Stethoscope }, // Placeholder
            { name: '🤖 AI Care Advisor', path: '/ai-bot', icon: Activity },
        ],
        Patient: [
            { name: 'My Health Summary', path: '/dashboard', icon: Activity },
            { name: 'My Care Plan', path: `/patient/${user?.sub}/care-plan`, icon: ClipboardList },
            { name: 'Appointments', path: '/appointments', icon: FileText }, // Placeholder
            { name: '🤖 AI Care Advisor', path: '/ai-bot', icon: Activity },
        ],
        Admin: [
            { name: 'Admin Overview', path: '/dashboard', icon: ShieldAlert },
            { name: 'User Management', path: '/admin/users', icon: Users },
            { name: 'Audit Logs', path: '/admin/audit', icon: FileText },
            { name: 'Compliance', path: '/admin/compliance', icon: ShieldAlert },
        ],
        Nurse: [
            { name: 'Ward Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Vitals Monitoring', path: '/nurse/vitals', icon: Activity },
        ],
        Staff: [
            { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        ]
    };

    // Fallback if role not found
    const currentNav = navItems[user?.role] || navItems['Staff'];

    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 transition-opacity lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Component */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:inset-0
            `}>
                <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
                    <div className="flex items-center">
                        <ShieldAlert className="h-8 w-8 text-teal-400" />
                        <span className="ml-3 text-xl font-bold tracking-wider">SECURE<span className="text-teal-400">MED</span></span>
                    </div>
                    <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <div className="flex items-center p-3 bg-slate-800 rounded-lg mb-6">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-500 flex items-center justify-center text-lg font-bold">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-slate-400">{user?.role || 'Guest'}</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {currentNav.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)} // Close on mobile navigation
                                    className={`
                                        group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                                        ${isActive(item.path)
                                            ? 'bg-teal-600 text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                                    `}
                                >
                                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Settings/Logout */}
                <div className="absolute bottom-0 w-full bg-slate-950 p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-md transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
