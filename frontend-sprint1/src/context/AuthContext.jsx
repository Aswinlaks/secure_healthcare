import { createContext, useContext, useState, useEffect } from 'react';

// Use Real API Client
import { loginUser, registerUser, verifyLoginOtp as apiVerifyLoginOtp, activateAccount as apiActivateAccount, resendOtp } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simple persistent login check
        try {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                // Real app would use jwt-decode properly
                try {
                    // Basic check if token exists
                    // Backend verification would be better, but for now assuming valid if present
                    // decode payload if needed
                    const payload = JSON.parse(atob(storedToken.split('.')[1]));
                    if (payload.exp * 1000 < Date.now()) {
                        logout();
                    } else {
                        // We don't store full user in token usually, but let's assume we decode role/id
                        setUser({ ...payload, token: storedToken });
                    }
                } catch (parseErr) {
                    console.log("Token parse error, logging out");
                    logout();
                }
            }
        } catch (e) {
            console.error("Auth Init Error", e);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await loginUser({ username, password });
            // Check if MFA is required
            if (response.data.mfaRequired) {
                return { success: true, status: 'OTP_SENT' };
            }
            // If no MFA (should not happen based on current backend logic but safe to handle)
            if (response.data.token) {
                const { token, role, user_id } = response.data;
                localStorage.setItem('token', token);
                setUser({ user_id, role, token });
                return { success: true, role };
            }
            return { success: false, message: 'Unexpected response' };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, message: error.response?.data?.error || 'Login failed' };
        }
    };

    const register = async (userData) => {
        try {
            await registerUser(userData);
            return { success: true };
        } catch (error) {
            console.error("Register Error:", error);
            return { success: false, message: error.response?.data?.error || 'Registration failed' };
        }
    };

    const verifyLoginOtp = async (username, otp) => {
        try {
            const response = await apiVerifyLoginOtp({ username, otp });

            if (response.data && response.data.token) {
                const { token, role, user_id } = response.data;
                localStorage.setItem('token', token);
                setUser({ user_id, role, token });
                return { success: true, role }; // Return role for redirect logic
            }
            return { success: false, message: 'Verification failed' };
        } catch (error) {
            console.error("Verify Login OTP Error:", error);
            return { success: false, message: error.response?.data?.error || 'Verification failed' };
        }
    };

    const activateAccount = async (email, otp, password) => {
        try {
            await apiActivateAccount({ email, otp, password });
            return { success: true };
        } catch (error) {
            console.error("Activate Account Error:", error);
            return { success: false, message: error.response?.data?.error || 'Activation failed' };
        }
    };

    const handleResendOtp = async (email) => {
        try {
            await resendOtp(email);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.error || 'Resend failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            verifyLoginOtp,
            activateAccount,
            resendOtp: handleResendOtp,
            isAuthenticated: !!user,
            role: user?.role,
            isLoading: loading
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
