/**
 * Generate a random secret for NEXTAUTH_SECRET.
 * Usage: node generate-secret.js
 */
const crypto = require("crypto");
console.log(crypto.randomBytes(32).toString("base64"));
