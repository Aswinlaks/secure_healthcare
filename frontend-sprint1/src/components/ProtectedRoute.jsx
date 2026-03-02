import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // If user exists but role is not allowed, redirect to dashboard or a specific "unauthorized" page
        // For now, let's keep it simple: access restricted view handled by Dashboard, or redirect there.
        // If this route is strictly for Doctors, and user is Staff, redirect to Dashboard.
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;
