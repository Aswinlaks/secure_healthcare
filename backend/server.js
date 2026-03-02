/**
 * Server Entry Point
 * 
 * This file initializes and starts the Express server for the Secure Healthcare
 * backend application. It imports the configured Express app and listens on
 * the specified port.
 * 
 * @module server
 */

// Import the configured Express application with all routes and middleware
const app = require("./src/app");

// Define the server port - uses environment variable or defaults to 5000
const PORT = process.env.PORT || 5000;

/**
 * Start the Express server
 * Listens on the configured PORT and logs startup information
 */
app.listen(PORT, () => {
  // Log successful server startup with the port number
  console.log(`🚀 Server running on port ${PORT}`);

  // Log timestamp for debugging purposes - useful during development
  console.log(`✅ Server restarted at ${new Date().toLocaleTimeString()} (Debug Mode)`);
});
