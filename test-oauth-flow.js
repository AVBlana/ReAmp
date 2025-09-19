#!/usr/bin/env node

// OAuth Flow Test Script
// This script helps test the OAuth flow and debug session issues

const https = require("https");
const http = require("http");

console.log("🧪 OAuth Flow Test Script");
console.log("========================");

// Test environment variables
function testEnvironmentVariables() {
  console.log("\n📋 Testing Environment Variables...");

  const requiredVars = [
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "NEXT_PUBLIC_SPOTIFY_CLIENT_ID",
    "NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET",
  ];

  let allSet = true;
  requiredVars.forEach((envVar) => {
    const value = process.env[envVar];
    if (value) {
      console.log(`  ✅ ${envVar}: SET`);
    } else {
      console.log(`  ❌ ${envVar}: MISSING`);
      allSet = false;
    }
  });

  return allSet;
}

// Test NextAuth endpoints
function testNextAuthEndpoints() {
  return new Promise((resolve) => {
    console.log("\n🔗 Testing NextAuth Endpoints...");

    const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const endpoints = [
      "/api/auth/providers",
      "/api/auth/csrf",
      "/api/auth/session",
    ];

    let completed = 0;
    const results = [];

    endpoints.forEach((endpoint) => {
      const url = `${nextAuthUrl}${endpoint}`;
      const protocol = url.startsWith("https") ? https : http;

      const req = protocol.get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          console.log(`  ${res.statusCode} ${endpoint}`);
          results.push({ endpoint, status: res.statusCode, data });
          completed++;
          if (completed === endpoints.length) {
            resolve(results);
          }
        });
      });

      req.on("error", (err) => {
        console.log(`  ❌ ${endpoint}: ${err.message}`);
        results.push({ endpoint, status: "ERROR", error: err.message });
        completed++;
        if (completed === endpoints.length) {
          resolve(results);
        }
      });

      req.setTimeout(5000, () => {
        console.log(`  ⏰ ${endpoint}: TIMEOUT`);
        results.push({ endpoint, status: "TIMEOUT" });
        completed++;
        if (completed === endpoints.length) {
          resolve(results);
        }
      });
    });
  });
}

// Test connected services endpoint
function testConnectedServicesEndpoint() {
  return new Promise((resolve) => {
    console.log("\n🔍 Testing Connected Services Endpoint...");

    const nextAuthUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = `${nextAuthUrl}/api/user/connected-services`;
    const protocol = url.startsWith("https") ? https : http;

    const req = protocol.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        console.log(`  Status: ${res.statusCode}`);
        console.log(`  Headers:`, res.headers);
        try {
          const jsonData = JSON.parse(data);
          console.log(`  Response:`, jsonData);
        } catch (e) {
          console.log(`  Raw Response:`, data);
        }
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on("error", (err) => {
      console.log(`  ❌ Error: ${err.message}`);
      resolve({ status: "ERROR", error: err.message });
    });

    req.setTimeout(5000, () => {
      console.log(`  ⏰ Timeout`);
      resolve({ status: "TIMEOUT" });
    });
  });
}

// Main test function
async function runTests() {
  console.log("Starting OAuth flow tests...\n");

  // Test 1: Environment Variables
  const envOk = testEnvironmentVariables();
  if (!envOk) {
    console.log(
      "\n❌ Environment variables test failed. Please set up .env.local file."
    );
    console.log("See DEBUGGING_GUIDE_401_FIX.md for details.");
    return;
  }

  // Test 2: NextAuth Endpoints
  const endpointResults = await testNextAuthEndpoints();
  const endpointOk = endpointResults.every(
    (r) => r.status === 200 || r.status === 401
  );

  if (!endpointOk) {
    console.log(
      "\n❌ NextAuth endpoints test failed. Check if server is running."
    );
    return;
  }

  // Test 3: Connected Services Endpoint
  const connectedServicesResult = await testConnectedServicesEndpoint();

  console.log("\n📊 Test Results Summary:");
  console.log(`  Environment Variables: ${envOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`  NextAuth Endpoints: ${endpointOk ? "✅ PASS" : "❌ FAIL"}`);
  console.log(
    `  Connected Services: ${
      connectedServicesResult.status === 401
        ? "⚠️  UNAUTHORIZED (Expected)"
        : connectedServicesResult.status === 200
        ? "✅ AUTHORIZED"
        : "❌ ERROR"
    }`
  );

  console.log("\n📝 Next Steps:");
  if (connectedServicesResult.status === 401) {
    console.log("1. Start development server: npm run dev");
    console.log("2. Open browser to http://localhost:3000");
    console.log('3. Click "Connect Spotify" or "Connect Google"');
    console.log("4. Complete OAuth flow");
    console.log("5. Check server logs for debugging output");
    console.log("6. Verify cookies are set in browser DevTools");
  } else if (connectedServicesResult.status === 200) {
    console.log("✅ Connected services endpoint is working!");
    console.log("The OAuth flow should work correctly.");
  } else {
    console.log("❌ There are issues with the connected services endpoint.");
    console.log(
      "Check server logs and ensure the API route is properly configured."
    );
  }

  console.log("\n🔍 Debugging Tips:");
  console.log(
    "- Check browser DevTools → Application → Cookies for next-auth.session-token"
  );
  console.log(
    "- Monitor Network tab for /api/user/connected-services requests"
  );
  console.log(
    "- Look for debug logs in server console with [connected-services] and [nextauth] markers"
  );
  console.log(
    "- Run node test-database-state.js to check Prisma database state"
  );
}

// Run the tests
runTests().catch(console.error);
