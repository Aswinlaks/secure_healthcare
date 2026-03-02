import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy will handle this or it can be set to env var
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login if 401
            localStorage.removeItem('token');
            // Ideally use a specialized navigation service or event, 
            // but for sprint 1, simple window.location is a fallback if outside React Context
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);


// Auth Endpoints matching Backend
export const verifyLoginOtp = (data) => api.post('/auth/login/verify-otp', { username: data.username, otp: data.otp });
export const resendOtp = (email) => api.post('/auth/resend-otp', { email }); // Check capability later
export const registerUser = (userData) => api.post('/auth/register', userData); // New Endpoint
export const loginUser = (credentials) => api.post('/auth/login', { username: credentials.username, password: credentials.password });
export const activateAccount = (data) => api.post('/auth/activate', { email: data.email, otp: data.otp, password: data.password }); // Replaces verifyOtp for Register

export default api;
