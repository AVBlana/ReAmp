// Test database connection
const { PrismaClient } = require("@prisma/client");

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    console.log("Testing database connection...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Not set");

    // Test the connection
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Query test successful:", result);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error.message);

    if (error.message.includes("port")) {
      console.log(
        "\n💡 Port number issue detected. Check your DATABASE_URL format:"
      );
      console.log(
        "Expected: postgresql://username:password@host:port/database?sslmode=require"
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
