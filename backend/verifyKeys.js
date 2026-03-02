require('dotenv').config();
const { attachLabPrivateKey } = require('./src/middleware/labKey.middleware');
const { signHash, verifySignature, hashData } = require('./src/utils/digitalSignature');
const fs = require('fs');

// Mock request and response
const req = {
    user: { role: 'LAB_TECH' }
};
const res = {
    status: (code) => ({ json: (data) => console.log(`Error ${code}:`, data) })
};
const next = () => console.log('Middleware called next()');

console.log("Testing Middleware...");
try {
    attachLabPrivateKey(req, res, next);

    if (req.labPrivateKey) {
        console.log("Private Key attached successfully.");
        console.log("Key starts with:", req.labPrivateKey.substring(0, 30).replace(/\n/g, '\\n'));

        const data = "Test Data for Signature";
        const hash = hashData(data);
        console.log("Hash generated:", hash);

        const signature = signHash(hash, req.labPrivateKey);
        console.log("Signature generated successfully.");

        // Verify with public key
        const publicKey = fs.readFileSync('lab_public_key.pem', 'utf8');
        const isValid = verifySignature(hash, signature, publicKey);
        console.log("Signature Verification Result:", isValid);

        if (isValid) {
            console.log("SUCCESS: Key generation and signing flow works.");
        } else {
            console.log("FAILURE: Signature verification failed.");
        }

    } else {
        console.log("FAILURE: Private Key not attached.");
    }
} catch (error) {
    console.error("Error during test:", error);
}
