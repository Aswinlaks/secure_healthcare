require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const pool = require("../src/config/db");

async function resetLabData() {
    const client = await pool.connect();
    try {
        console.log("Starting lab data reset...");
        await client.query("BEGIN");

        // 1. Delete all lab reports (these are the encrypted ones causing issues)
        const deleteRes = await client.query("DELETE FROM lab_reports");
        console.log(`Deleted ${deleteRes.rowCount} encrypted lab reports.`);

        // 2. Reset all lab orders to 'ORDERED' status so they can be fulfilled again
        //    We also clear the lab_tech_id since a new tech might fulfill it
        const updateRes = await client.query(`
      UPDATE lab_orders 
      SET status = 'ORDERED', 
          lab_tech_id = NULL
      WHERE status = 'COMPLETED'
    `);
        console.log(`Reset ${updateRes.rowCount} lab orders to 'ORDERED' status.`);

        await client.query("COMMIT");
        console.log("✅ Lab data reset successfully! You can now upload reports again.");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("❌ Error resetting lab data:", err);
    } finally {
        client.release();
        pool.end(); // Close the pool to allow script to exit
    }
}

resetLabData();
