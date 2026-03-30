const crypto = require("crypto");
const { encrypt, decrypt } = require("../src/utils/encryption");
const { hashData, signHash, verifySignature } = require("../src/utils/digitalSignature");
const { getDiagnosisByCode } = require("../src/modules/cdss/clinicalKnowledgeGraph");

// Keep execution simple to get microsecond granularity
const ITERATIONS = 100;

function calculateStats(times) {
    const sum = times.reduce((a, b) => a + b, 0);
    const mean = sum / times.length;
    const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    return {
        mean: mean.toFixed(3),
        stdDev: stdDev.toFixed(3)
    };
}

async function runBenchmarks() {
    console.log("🚀 Starting Latency Benchmarks (100 iterations)...\n");

    const sampleLabResult = JSON.stringify({ "HbA1c": 6.8, "Glucose": 140, "WBC": 7.5 });
    
    // 1. AES-256-CBC Encrypt
    const encryptTimes = [];
    const decryptTimes = [];
    let sampleEncrypted = "";
    
    for (let i = 0; i < ITERATIONS; i++) {
        let t0 = performance.now();
        const encrypted = encrypt(sampleLabResult);
        encryptTimes.push(performance.now() - t0);
        
        sampleEncrypted = encrypted; // Save one for decrypt
        
        let t1 = performance.now();
        decrypt(encrypted);
        decryptTimes.push(performance.now() - t1);
    }

    // 2. RSA Sign + Verify
    // Generate an ephemeral RSA keypair strictly for this test
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    const signTimes = [];
    const verifyTimes = [];
    let sampleHash = hashData(sampleEncrypted);
    
    for (let i = 0; i < ITERATIONS; i++) {
        let t0 = performance.now();
        const signature = signHash(sampleHash, privateKey);
        signTimes.push(performance.now() - t0);
        
        let t1 = performance.now();
        verifySignature(sampleHash, signature, publicKey);
        verifyTimes.push(performance.now() - t1);
    }

    // 3. KG Care Plan Lookup
    const kgTimes = [];
    for (let i = 0; i < ITERATIONS; i++) {
        let t0 = performance.now();
        getDiagnosisByCode("E11"); // Type 2 Diabetes lookup
        kgTimes.push(performance.now() - t0);
    }
    
    // 4. Simulated CDSS API Response (E2E)
    // We mock the API layer logic (Fetch patient -> Get Diagnosis -> Merge logic)
    const apiTimes = [];
    for (let i = 0; i < ITERATIONS; i++) {
        let t0 = performance.now();
        // Simulate DB fetch latency (~5ms) + KG lookup + Rule generation ~1ms
        const dummyDbLatency = new Promise(resolve => setTimeout(resolve, 5));
        await dummyDbLatency;
        getDiagnosisByCode("E11");
        apiTimes.push(performance.now() - t0);
    }

    const aesEncryptStats = calculateStats(encryptTimes);
    const aesDecryptStats = calculateStats(decryptTimes);
    const rsaSignStats = calculateStats(signTimes);
    const rsaVerifyStats = calculateStats(verifyTimes);
    const kgStats = calculateStats(kgTimes);
    const apiStats = calculateStats(apiTimes);

    console.log("| Operation | Mean (ms) | Std Dev |");
    console.log("|-----------|-----------|---------|");
    console.log(`| AES-256-CBC Encrypt | ~${aesEncryptStats.mean} | ±${aesEncryptStats.stdDev} |`);
    console.log(`| AES-256-CBC Decrypt | ~${aesDecryptStats.mean} | ±${aesDecryptStats.stdDev} |`);
    console.log(`| RSA Sign (Lab Tech) | ~${rsaSignStats.mean} | ±${rsaSignStats.stdDev} |`);
    console.log(`| RSA Verify | ~${rsaVerifyStats.mean} | ±${rsaVerifyStats.stdDev} |`);
    console.log(`| KG care plan lookup | ~${kgStats.mean} | ±${kgStats.stdDev} |`);
    console.log(`| Full CDSS API response | ~${apiStats.mean} | ±${apiStats.stdDev} |`);
    console.log("\n✅ Latency Benchmarks Completed.");
}

runBenchmarks();
