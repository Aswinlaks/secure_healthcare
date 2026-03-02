const path = require('path');
const dotenvPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: dotenvPath });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function testDay() {
    const client = await pool.connect();
    try {
        // We need a valid user_id to test with.
        // Let's pick one from the users table.
        const userRes = await client.query("SELECT user_id FROM users WHERE role = 'DOCTOR' LIMIT 1");
        if (userRes.rows.length === 0) {
            console.log("No doctor found to test with.");
            return;
        }
        const userId = userRes.rows[0].user_id;
        console.log(`Testing with user_id: ${userId}`);

        // Construct query
        const query = `
            INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_active)
            VALUES ($1, $2, '09:00:00', '17:00:00', true)
            ON CONFLICT (doctor_id, day_of_week) DO NOTHING
        `;

        // Test day 0
        try {
            console.log("Testing day_of_week = 0");
            await client.query(query, [userId, 0]);
            console.log("Success: day_of_week = 0 is valid.");
        } catch (e) {
            console.log(`Failed: day_of_week = 0. Error: ${e.message}`);
        }

        // Test day 7
        try {
            console.log("Testing day_of_week = 7");
            await client.query(query, [userId, 7]);
            console.log("Success: day_of_week = 7 is valid.");
        } catch (e) {
            console.log(`Failed: day_of_week = 7. Error: ${e.message}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

testDay();
