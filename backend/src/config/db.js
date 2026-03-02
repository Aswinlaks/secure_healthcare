/**
 * Database Configuration Module
 * 
 * This module establishes and exports a connection pool to the PostgreSQL
 * database hosted on Neon (serverless PostgreSQL). It uses the 'pg' library
 * to create a connection pool that can handle multiple concurrent queries.
 * 
 * @module config/db
 */

// Import the Pool class from pg library for connection pooling
const { Pool } = require("pg");

/**
 * PostgreSQL Connection Pool
 * 
 * Creates a new connection pool using the DATABASE_URL from environment variables.
 * The pool manages multiple connections and reuses them for efficiency.
 * 
 * Configuration:
 * - connectionString: The full database connection URL from .env
 * - ssl.rejectUnauthorized: Set to false for Neon serverless PostgreSQL compatibility
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for Neon serverless PostgreSQL - allows self-signed certificates
    },
});

/**
 * Test Database Connection
 * 
 * Attempts to establish a connection when the module loads.
 * Logs success or failure to help with debugging startup issues.
 */
pool.connect()
    .then(() => console.log("PostgreSQL (Neon) connected successfully ✅"))
    .catch((err) => {
        console.error("PostgreSQL connection failed ❌");
        console.error(err);
    });

// Export the pool for use in other modules (repositories, services)
module.exports = pool;