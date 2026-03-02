const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const pool = require("./src/config/db");

async function verify() {
    const logFile = path.resolve(__dirname, "verify_output.txt");
    const logStream = fs.createWriteStream(logFile);

    try {
        const ids = ['3ed4892d-b6a3-4a74-84c5-3a0ae449e79d', '5fc9f9ba-8c78-4746-acc3-70e3c05b4f97'];
        const res = await pool.query("SELECT user_id FROM user_public_keys WHERE user_id = ANY($1)", [ids]);

        logStream.write(`Found ${res.rowCount} keys out of ${ids.length}\n`);
        res.rows.forEach(r => {
            logStream.write(`User ID present: ${r.user_id}\n`);
        });
        console.log("Verification finished.");
    } catch (err) {
        logStream.write(`ERROR: ${err.message}\n`);
    } finally {
        logStream.end();
        await pool.end();
    }
}

verify();
