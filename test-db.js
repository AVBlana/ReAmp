const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log("🔍 Testing database connection...");

    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Test query
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);

    // Test account table
    const accountCount = await prisma.account.count();
    console.log(`🔐 Current accounts in database: ${accountCount}`);

    // Test session table
    const sessionCount = await prisma.session.count();
    console.log(`🔄 Current sessions in database: ${sessionCount}`);

    console.log("✅ All database tests passed");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkEnvironmentVariables() {
  console.log("🔍 Checking environment variables...");

  const requiredVars = [
    "NEXT_PUBLIC_DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "NEXT_PUBLIC_SPOTIFY_CLIENT_ID",
    "NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET",
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET",
  ];

  const missingVars = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
      console.log(`❌ Missing: ${varName}`);
    } else {
      console.log(`✅ Found: ${varName}`);
    }
  }

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing environment variables: ${missingVars.join(", ")}`
    );
    return false;
  }

  console.log("✅ All required environment variables are set");
  return true;
}

async function main() {
  console.log("🚀 ReAMP Database and Environment Test");
  console.log("=====================================");

  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    process.exit(1);
  }

  await testDatabaseConnection();

  console.log("🎉 All tests completed successfully!");
}

main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
