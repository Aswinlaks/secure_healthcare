const axios = require('axios');

async function testUpload() {
    try {
        console.log("Testing Lab Report Upload Endpoint...");
        // Intentional bad request to check if we get JSON or HTML
        const response = await axios.post('http://localhost:5000/labs/reports', {
            order_id: 'test',
            result_values: 'test'
        });
        console.log("Response:", response.data);
    } catch (err) {
        console.log("Error status:", err.response?.status);
        console.log("Error data type:", typeof err.response?.data);
        console.log("Error data:", JSON.stringify(err.response?.data, null, 2));

        if (typeof err.response?.data === 'string' && err.response?.data.includes('<!DOCTYPE html>')) {
            console.log("❌ FAILED: Still getting HTML error pages.");
        } else if (err.response?.data?.success === false || err.response?.data?.error) {
            console.log("✅ PASSED: Getting JSON error responses.");
        } else {
            console.log("❓ UNKNOWN: ", err.response?.data);
        }
    }
}

testUpload();
