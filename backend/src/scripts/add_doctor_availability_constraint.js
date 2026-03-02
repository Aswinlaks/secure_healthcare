const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting migration: Adding unique constraint to doctor_availability...");

        await client.query('BEGIN');

        // Check if constraint exists first to be idempotent
        const check = await client.query(`
            SELECT conname
            FROM pg_constraint
            WHERE conname = 'unique_doctor_day_availability';
        `);

        if (check.rows.length === 0) {
            // First, remove duplicates if any exist, to allow adding the constraint
            // Keep the latest one (highest id or similar, but this table might not have a primary key ID?)
            // Let's check schema quick via query if we can, or just try to delete duplicates based on purely the collision columns.
            // A common way to delete duplicates:
            await client.query(`
                DELETE FROM doctor_availability a USING (
                    SELECT MIN(ctid) as ctid, doctor_id, day_of_week
                    FROM doctor_availability 
                    GROUP BY doctor_id, day_of_week HAVING COUNT(*) > 1
                ) b
                WHERE a.doctor_id = b.doctor_id 
                AND a.day_of_week = b.day_of_week 
                AND a.ctid <> b.ctid;
            `);

            // Now add the constraint
            await client.query(`
                ALTER TABLE doctor_availability
                ADD CONSTRAINT unique_doctor_day_availability UNIQUE (doctor_id, day_of_week);
            `);
            console.log("Constraint 'unique_doctor_day_availability' added successfully.");
        } else {
            console.log("Constraint 'unique_doctor_day_availability' already exists.");
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
