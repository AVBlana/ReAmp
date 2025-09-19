#!/usr/bin/env node

// Test script to verify NextAuth configuration and environment variables
console.log("🔍 NextAuth Configuration Test");
console.log("================================");

// Check environment variables
const requiredEnvVars = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_SPOTIFY_CLIENT_ID",
  "NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET",
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
  "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET",
];

console.log("\n📋 Environment Variables:");
requiredEnvVars.forEach((envVar) => {
  const value = process.env[envVar];
  const status = value ? "✅ SET" : "❌ MISSING";
  console.log(`  ${envVar}: ${status}`);
  if (value && envVar.includes("SECRET")) {
    console.log(`    Value: ${value.substring(0, 8)}...`);
  } else if (value) {
    console.log(`    Value: ${value}`);
  }
});

// Check NEXTAUTH_URL format
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  console.log("\n🔗 NEXTAUTH_URL Analysis:");
  console.log(`  URL: ${nextAuthUrl}`);

  try {
    const url = new URL(nextAuthUrl);
    console.log(`  Protocol: ${url.protocol}`);
    console.log(`  Host: ${url.host}`);
    console.log(`  Port: ${url.port || "default"}`);

    // Check if it matches expected callback URLs
    console.log("\n📞 Expected Callback URLs:");
    console.log(`  Spotify: ${nextAuthUrl}/api/auth/callback/spotify`);
    console.log(`  Google: ${nextAuthUrl}/api/auth/callback/google`);
  } catch (error) {
    console.log(`  ❌ Invalid URL format: ${error.message}`);
  }
} else {
  console.log("\n❌ NEXTAUTH_URL is not set");
}

// Check if we're in development mode
console.log("\n🛠️  Environment:");
console.log(`  NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
console.log(
  `  Development: ${
    process.env.NODE_ENV === "development" ? "✅ YES" : "❌ NO"
  }`
);

// Check cookie configuration
console.log("\n🍪 Cookie Configuration:");
const isProduction = process.env.NODE_ENV === "production";
console.log(`  Environment: ${isProduction ? "Production" : "Development"}`);
console.log(
  `  Cookie Name: ${
    isProduction
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"
  }`
);
console.log(`  Secure: ${isProduction ? "true" : "false"}`);
console.log(`  SameSite: lax`);

console.log("\n✅ Configuration test complete!");
console.log("\n📝 Next Steps:");
console.log("1. Ensure all environment variables are set");
console.log("2. Verify NEXTAUTH_URL matches your domain");
console.log("3. Check that provider callback URLs are registered correctly");
console.log("4. Run OAuth flow and check server logs for debugging output");
