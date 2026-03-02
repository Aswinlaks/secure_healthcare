const { Pool } = require("pg");
const path = require('path');
const crypto = require('crypto');
require("dotenv").config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function fixKeys(labTechId) {
    const client = await pool.connect();
    try {
        console.log(`\n🔧 FIXING KEYS FOR LAB TECH: ${labTechId}\n`);

        // 1. Get Private Key from Env
        const privateKeyPem = process.env.LAB_PRIVATE_KEY.replace(/\\n/g, '\n');

        // 2. Derive Public Key
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        const publicKeyObject = crypto.createPublicKey(privateKey);
        const publicKeyPem = publicKeyObject.export({
            type: 'spki',
            format: 'pem'
        });

        console.log("Derived Public Key from ENV.");

        // 3. Insert into user_public_keys (Simple insert, assuming no previous key exists based on diagnostic)
        const checkRes = await client.query('SELECT 1 FROM user_public_keys WHERE user_id = $1', [labTechId]);

        if (checkRes.rowCount === 0) {
            await client.query(`
                INSERT INTO user_public_keys (user_id, public_key_pem, created_at)
                VALUES ($1, $2, NOW());
            `, [labTechId, publicKeyPem]);
            console.log("✅ Successfully inserted public key for Lab Tech.");
        } else {
            console.log("⚠️ Key already exists (race condition?), verifying/updating...");
            await client.query(`
                UPDATE user_public_keys SET public_key_pem = $2 WHERE user_id = $1;
             `, [labTechId, publicKeyPem]);
            console.log("✅ Successfully updated public key.");
        }

    } catch (err) {
        console.error("Error fixing keys:", err);
    } finally {
        client.release();
        pool.end();
    }
}

// User ID from previous diagnostic output
const LAB_TECH_ID = "37dbe36d-d606-493a-adc0-1b86d0e42ebe";

if (process.argv[2]) {
    fixKeys(process.argv[2]);
} else {
    fixKeys(LAB_TECH_ID);
}
