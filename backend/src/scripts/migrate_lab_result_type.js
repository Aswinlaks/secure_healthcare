const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../../.env') });
const pool = require("../config/db");

const migrate = async () => {
    const client = await pool.connect();
    try {
        console.log("Starting migration: lab_reports.result_values -> TEXT");

        await client.query("BEGIN");

        // 1. Check current column type (optional, but good for safety)
        // For now, valid assumption is it is JSONB or similar.

        // 2. We want to convert existing data: { "cipher": "..." } -> "..."
        // If it's already text, this might fail or be weird, so we should handle it.
        // However, if it's JSONB, we can use ->> operator.

        // Check if column is jsonb
        const checkRes = await client.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'lab_reports' AND column_name = 'result_values'
    `);

        if (checkRes.rows.length > 0) {
            const type = checkRes.rows[0].data_type;
            console.log(`Current column type: ${type}`);

            if (type === 'jsonb' || type === 'json') {
                // Update data first to be just the cipher string, but cast to text
                // We use a temporary column or alter with USING

                // ALTER TABLE lab_reports ALTER COLUMN result_values TYPE TEXT USING result_values->>'cipher';
                // But if some rows don't have 'cipher' key (legacy?), we should fallback to the whole json string?
                // Use COALESCE(result_values->>'cipher', result_values::text)

                await client.query(`
                ALTER TABLE lab_reports 
                ALTER COLUMN result_values TYPE TEXT 
                USING COALESCE(result_values->>'cipher', result_values::text);
             `);

                console.log("Altered column type to TEXT and migrated data.");
            } else if (type === 'text' || type === 'character varying') {
                console.log("Column is already text. No schema change needed.");
            }
        } else {
            console.error("Column result_values not found in lab_reports");
        }

        await client.query("COMMIT");
        console.log("Migration completed successfully.");
        process.exit(0);

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate();
