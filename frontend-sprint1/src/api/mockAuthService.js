import { sendOtpEmail } from '../services/emailService';

// --- SIMPLE STORAGE HELPERS ---
const getDB = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Storage Error:", e);
        return null;
    }
};

const setDB = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const DB_USERS = "simple_users_v1";
const DB_OTPS = "simple_otps_v1";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- MOCK API IMPLEMENTATION ---
export const loginUser = async ({ email, password }) => {
    console.log('[MOCK_API] Login:', email);
    const users = getDB(DB_USERS) || [];

    // Hardcoded fallback user
    if (email === 'doctor@test.com' && password === 'password') {
        const otp = generateOTP();
        saveOtp(email, otp, { user_id: 1, name: 'Dr. John Doe', email, role: 'Doctor' });
        await sendOtpEmail(email, otp, 'Dr. John Doe');
        return { data: { message: "OTP sent" } };
    }

    const user = users.find(u => u.email === email.toLowerCase().trim() && u.password === password);

    if (!user) {
        throw { response: { data: { message: "Invalid credentials" } } };
    }

    const otp = generateOTP();
    saveOtp(email, otp, user);
    await sendOtpEmail(email, otp, user.name);

    return { data: { message: "OTP sent" } };
};

export const registerUser = async ({ email, password, name, role }) => {
    console.log('[MOCK_API] Register:', email);
    const normalizedEmail = email.toLowerCase().trim();
    const users = getDB(DB_USERS) || [];

    if (users.find(u => u.email === normalizedEmail)) {
        throw { response: { data: { message: "Email already registered" } } };
    }

    const otp = generateOTP();
    // Save pending user data in the OTP record itself
    const pendingUser = {
        user_id: Date.now(), // ID based on timestamp
        email: normalizedEmail,
        password,
        name,
        role
    };

    saveOtp(normalizedEmail, otp, null, pendingUser);
    await sendOtpEmail(normalizedEmail, otp, name);

    return { data: { message: "Registration successful. Verify OTP." } };
};

export const verifyOtp = async ({ email, otp }) => {
    console.log('[MOCK_API] Verify:', email, otp);
    const normalizedEmail = email.toLowerCase().trim();
    const otps = getDB(DB_OTPS) || {};
    const record = otps[normalizedEmail];

    if (!record) {
        console.error('[MOCK_API] No OTP record found for:', normalizedEmail);
        throw { response: { data: { message: "OTP not found (or expired). Resend it." } } };
    }

    if (String(record.otp) !== String(otp)) {
        console.error('[MOCK_API] Invalid OTP. Expected:', record.otp, 'Got:', otp);
        throw { response: { data: { message: "Invalid OTP" } } };
    }

    if (Date.now() > record.expiresAt) {
        throw { response: { data: { message: "OTP expired" } } };
    }

    // Success! Finalize user creation if pending
    let user = record.user;
    if (record.pendingUser) {
        user = record.pendingUser;
        const users = getDB(DB_USERS) || [];
        users.push(user);
        setDB(DB_USERS, users);
        console.log('[MOCK_API] User Created:', user);
    }

    // Create a simple token
    const token = btoa(JSON.stringify({
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        exp: Date.now() + 3600000
    })); // Simple base64 mock token

    // CLEANUP: We do NOT delete OTP immediately to prevent race conditions (double verify)
    // delete otps[normalizedEmail];
    // setDB(DB_OTPS, otps);

    return {
        data: {
            token,
            user: { ...user, token }
        }
    };
};

export const resendOtp = async (data) => {
    const email = (typeof data === 'string' ? data : data.email).toLowerCase().trim();
    console.log('[MOCK_API] Resend:', email);

    // Check if user exists OR if there was a pending registration
    const users = getDB(DB_USERS) || [];
    const otps = getDB(DB_OTPS) || {};

    const existingUser = users.find(u => u.email === email);
    const pendingRecord = otps[email];

    if (!existingUser && !pendingRecord?.pendingUser) {
        throw { response: { data: { message: "User not found" } } };
    }

    const name = existingUser ? existingUser.name : (pendingRecord?.pendingUser?.name || 'User');
    const otp = generateOTP();

    // Preserve the pending user info if it exists
    const pendingUser = pendingRecord?.pendingUser;

    saveOtp(email, otp, existingUser, pendingUser);
    await sendOtpEmail(email, otp, name);

    return { data: { message: "OTP resent" } };
};

// --- INTERNAL HELPERS ---
function saveOtp(email, otp, user = null, pendingUser = null) {
    const otps = getDB(DB_OTPS) || {};
    otps[email.toLowerCase().trim()] = {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
        user,
        pendingUser
    };
    setDB(DB_OTPS, otps);
}
