import emailjs from '@emailjs/browser';

// CONFIGURATION - REPLACE WITH YOUR ACTUAL KEYS
// You can also move these to .env (VITE_EMAILJS_...)
const EMAILJS_SERVICE_ID = "service_q0ew1ht";
const EMAILJS_TEMPLATE_ID = "template_agobg2n";
const EMAILJS_PUBLIC_KEY = "AjjELeucm-wEo7cwh";

export const initEmailJS = () => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
};

export const sendOtpEmail = async (email, otp, name = "User") => {
    try {
        const templateParams = {
            to_email: email,
            to_name: name,
            passcode: otp,
            message: `Your One-Time Password is: ${otp}. It expires in 5 minutes.`,
        };

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        console.log('EmailJS Success:', response.status, response.text);
        return { success: true };
    } catch (error) {
        console.error('EmailJS Failed Details:', JSON.stringify(error));
        if (error.text) console.error('EmailJS Error Text:', error.text);
        return { success: false, error: error };
    }
};
