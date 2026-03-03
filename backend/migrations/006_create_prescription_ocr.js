/**
 * Migration: Create prescription_ocr table
 *
 * Stores OCR extraction results from prescription images.
 * Includes raw text, cleaned text, extracted medications,
 * diagnosis codes, and patient information.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../src/config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting migration: Create prescription_ocr table');
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS prescription_ocr (
                id SERIAL PRIMARY KEY,
                raw_text TEXT,
                cleaned_text TEXT,
                ocr_confidence REAL,
                quality VARCHAR(20) DEFAULT 'fair',
                medications JSONB DEFAULT '[]'::jsonb,
                diagnosis_codes JSONB DEFAULT '[]'::jsonb,
                patient_info JSONB DEFAULT '{}'::jsonb,
                original_filename VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Create indexes for faster lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_prescription_ocr_created_at 
            ON prescription_ocr (created_at DESC);
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_prescription_ocr_quality 
            ON prescription_ocr (quality);
        `);

        await client.query('COMMIT');
        console.log('✅ prescription_ocr table created successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
