const bcrypt = require('bcryptjs');
const { encrypt } = require('../src/utils/encryption');
const autocannon = require('autocannon');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const ioClient = require("socket.io-client");

async function calculateSecurityMetrics() {
    console.log("🔒 Calculating Deep Security Metrics...");
    
    // 1. BCrypt Overhead
    const startBcrypt = performance.now();
    await bcrypt.hash("StrongPassword123!", 12);
    const bcryptTime = (performance.now() - startBcrypt).toFixed(2);
    
    // 2. Ciphertext Expansion
    const dummyLabReport = {
        patient_id: "12345",
        test_type: "Comprehensive Metabolic Panel",
        results: { Glucose: 95, Calcium: 9.6, Sodium: 140, Potassium: 4.5, CO2: 25, Chloride: 101, BUN: 15, Creatinine: 0.8 },
        notes: "Patient is healthy, no abnormalities detected. Continue current lifestyle."
    };
    const plaintextString = JSON.stringify(dummyLabReport);
    const plaintextSize = Buffer.byteLength(plaintextString, 'utf8');
    
    const ciphertext = encrypt(plaintextString);
    const ciphertextSize = Buffer.byteLength(ciphertext, 'utf8');
    
    const expansionRatio = ((ciphertextSize / plaintextSize) * 100).toFixed(1);
    
    console.log(`✅ BCrypt (12 Rounds) hashing time: ${bcryptTime} ms`);
    console.log(`✅ Plaintext JSON Size: ${plaintextSize} bytes`);
    console.log(`✅ AES-256 Ciphertext Size: ${ciphertextSize} bytes`);
    console.log(`✅ Ciphertext Expansion Ratio: ${expansionRatio}% of original size\n`);
    
    return { bcryptTime, plaintextSize, ciphertextSize, expansionRatio };
}

async function calculateLoadAndWebSocketMetrics() {
    console.log("🚀 Starting Local Express Server for Load Testing...");
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);
    
    app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
    
    // WebSockets Echo for RTT
    io.on('connection', (socket) => {
        socket.on('pingMessage', (timestamp) => {
            socket.emit('pongMessage', timestamp);
        });
    });

    return new Promise((resolve, reject) => {
        server.listen(0, '127.0.0.1', async () => {
            const port = server.address().port;
            console.log(`Server running on port ${port}...`);
            
            // 1. WebSocket RTT
            const clientSocket = ioClient(`http://127.0.0.1:${port}`, { transports: ['websocket'] });
            
            clientSocket.on('connect', () => {
                const start = performance.now();
                clientSocket.emit('pingMessage', start);
                clientSocket.once('pongMessage', (sentTime) => {
                    const rtt = (performance.now() - start).toFixed(2);
                    console.log(`✅ Average WebSocket RTT: ${rtt} ms\n`);
                    clientSocket.disconnect();
                    
                    // Trigger Autocannon Load Testing (100 concurrent connections for 5 seconds)
                    console.log("💣 Firing Autocannon Load Test (100 concurrent connections, 5 seconds)...");
                    const instance = autocannon({
                        url: `http://127.0.0.1:${port}/api/health`,
                        connections: 100,
                        duration: 5,
                        pipelining: 1
                    }, (err, result) => {
                        if (err) reject(err);
                        
                        console.log(`✅ Requests Per Second (RPS) Average: ${result.requests.average}`);
                        console.log(`✅ Latency Average under load: ${result.latency.average} ms`);
                        console.log(`✅ Total Requests processed: ${result.requests.total}`);
                        console.log(`✅ Errors: ${result.errors}`);
                        
                        server.close(() => {
                            resolve({
                                avgRtt: rtt,
                                rps: result.requests.average,
                                loadLatency: result.latency.average,
                                totalReqs: result.requests.total
                            });
                        });
                    });
                });
            });
        });
    });
}

async function run() {
    try {
        const security = await calculateSecurityMetrics();
        const load = await calculateLoadAndWebSocketMetrics();
        
        console.log("\n==================================");
        console.log("     FINAL EXTRACTED METRICS      ");
        console.log("==================================");
        console.log(JSON.stringify({ security, load }, null, 2));
    } catch(err) {
        console.error("Test Failed", err);
    }
}

run();
