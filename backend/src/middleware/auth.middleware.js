/**
 * Authentication Middleware
 * 
 * This middleware verifies JWT tokens on protected routes. It extracts the
 * token from the Authorization header, validates it, and attaches the decoded
 * user information to the request object for downstream use.
 * 
 * Usage: Apply to any route that requires authentication
 * Example: router.get("/protected", authenticate, controller.handler);
 * 
 * @module middleware/auth
 */

"use strict";

// JWT library for token verification
const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware Function
 * 
 * Validates JWT tokens from the Authorization header.
 * 
 * Expected header format: "Bearer <token>"
 * 
 * On success:
 * - Decodes the token and attaches user info to req.user
 * - req.user contains: user_id, role, iat (issued at), exp (expiration)
 * 
 * On failure:
 * - Returns 401 Unauthorized with appropriate error message
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
module.exports.authenticate = (req, res, next) => {
    // Extract the Authorization header
    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            error: "Authorization token missing"
        });
    }

    // Extract the token by splitting "Bearer <token>"
    const token = authHeader.split(" ")[1];

    try {
        // Verify the token using the JWT secret from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach decoded user information to the request object
        // This makes user_id and role available to all subsequent middleware and routes
        req.user = decoded;

        // Continue to the next middleware or route handler
        next();
    } catch (err) {
        // Token is invalid or expired
        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
};