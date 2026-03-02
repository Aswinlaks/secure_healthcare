require("dotenv").config();

const pool = require("../config/db");
const { encrypt } = require("../utils/crypto.util");

async function run() {
  const result = await pool.query(
    "SELECT patient_id, full_name_encrypted FROM patients"
  );

  for (const row of result.rows) {
    // Skip already encrypted values
    if (row.full_name_encrypted && row.full_name_encrypted.includes(":")) {
      continue;
    }

    const encrypted = encrypt(row.full_name_encrypted);

    await pool.query(
      "UPDATE patients SET full_name_encrypted = $1 WHERE patient_id = $2",
      [encrypted, row.patient_id]
    );
  }

  console.log("✅ Existing patient names encrypted successfully");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Encryption script failed:", err);
  process.exit(1);
});
