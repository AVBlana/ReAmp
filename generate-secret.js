#!/usr/bin/env node

/**
 * Generate a secure NextAuth secret
 * Run with: node generate-secret.js
 */

const crypto = require("crypto");

function generateSecret() {
  // Generate a 32-byte random string and encode as base64
  const secret = crypto.randomBytes(32).toString("base64");

  console.log("🔐 Generated NextAuth Secret:");
  console.log("=====================================");
  console.log(secret);
  console.log("=====================================");
  console.log("");
  console.log("📝 Add this to your environment variables:");
  console.log("");
  console.log("Local (.env.local):");
  console.log(`NEXTAUTH_SECRET="${secret}"`);
  console.log("");
  console.log("Production (Vercel):");
  console.log(`NEXTAUTH_SECRET=${secret}`);
  console.log("");
  console.log(
    "⚠️  Keep this secret secure and never commit it to version control!"
  );
}

generateSecret();

