const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addAdminUser() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const username = 'admin1';
        const password = 'admin123';
        const email = 'admin1@hospital.com'; // Dummy email for admin
        const passwordHash = await bcrypt.hash(password, 12);

        // Check if user exists
        const userCheck = await client.query('SELECT user_id FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            console.log('User admin1 already exists.');
            await client.query('ROLLBACK');
            return;
        }

        // Insert user
        const userRes = await client.query(
            `INSERT INTO users (username, email, password_hash, mfa_enabled, is_active)
       VALUES ($1, $2, $3, false, true)
       RETURNING user_id`,
            [username, email, passwordHash]
        );
        const userId = userRes.rows[0].user_id;

        // Get ADMIN role id
        const roleRes = await client.query("SELECT role_id FROM roles WHERE role_name = 'ADMIN'");
        if (roleRes.rows.length === 0) {
            // Fallback: Check if role is lowercase 'admin' or create it? 
            // Based on auth.service.js, usage is 'PATIENT' uppercase, but let's check roles table if we fail.
            // For now assuming 'ADMIN' or 'admin' exists. 
            // Let's try 'ADMIN' first, if result 0, try 'admin'.
            let startRoleRes = await client.query("SELECT role_id FROM roles WHERE role_name = 'admin'");
            if (startRoleRes.rows.length === 0) {
                throw new Error("Role ADMIN not found");
            }
            var roleId = startRoleRes.rows[0].role_id;
        } else {
            var roleId = roleRes.rows[0].role_id;
        }

        // Assign role
        await client.query(
            `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
            [userId, roleId]
        );

        await client.query('COMMIT');
        console.log(`User ${username} created successfully with ID: ${userId}`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error adding user:', e);
    } finally {
        client.release();
        pool.end();
    }
}

addAdminUser();
