import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabaseState() {
  console.log("🔍 Database State Check");
  console.log("======================");

  try {
    // Check Users table
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            accounts: true,
            sessions: true,
          },
        },
      },
    });

    console.log(`\n👥 Users (${users.length}):`);
    users.forEach((user) => {
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Accounts: ${user._count.accounts}`);
      console.log(`  Sessions: ${user._count.sessions}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log("  ---");
    });

    // Check Accounts table
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        provider: true,
        providerAccountId: true,
        access_token: true,
        refresh_token: true,
        expires_at: true,
        scope: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log(`\n🔗 Accounts (${accounts.length}):`);
    accounts.forEach((account) => {
      console.log(`  ID: ${account.id}`);
      console.log(`  Provider: ${account.provider}`);
      console.log(`  Provider Account ID: ${account.providerAccountId}`);
      console.log(`  User Email: ${account.user.email}`);
      console.log(`  Has Access Token: ${!!account.access_token}`);
      console.log(`  Has Refresh Token: ${!!account.refresh_token}`);
      console.log(
        `  Expires At: ${
          account.expires_at
            ? new Date(account.expires_at * 1000).toISOString()
            : "Never"
        }`
      );
      console.log(`  Scope: ${account.scope}`);
      console.log("  ---");
    });

    // Check Sessions table
    const sessions = await prisma.session.findMany({
      select: {
        id: true,
        sessionToken: true,
        userId: true,
        expires: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    console.log(`\n🔐 Sessions (${sessions.length}):`);
    sessions.forEach((session) => {
      console.log(`  ID: ${session.id}`);
      console.log(
        `  Session Token: ${session.sessionToken.substring(0, 20)}...`
      );
      console.log(`  User Email: ${session.user.email}`);
      console.log(`  Expires: ${session.expires.toISOString()}`);
      console.log(
        `  Valid: ${session.expires > new Date() ? "✅ YES" : "❌ EXPIRED"}`
      );
      console.log("  ---");
    });

    // Summary
    console.log("\n📊 Summary:");
    console.log(`  Total Users: ${users.length}`);
    console.log(`  Total Accounts: ${accounts.length}`);
    console.log(`  Total Sessions: ${sessions.length}`);
    console.log(
      `  Active Sessions: ${
        sessions.filter((s) => s.expires > new Date()).length
      }`
    );

    // Check for potential issues
    console.log("\n🔍 Potential Issues:");

    const usersWithoutAccounts = users.filter((u) => u._count.accounts === 0);
    if (usersWithoutAccounts.length > 0) {
      console.log(
        `  ⚠️  ${usersWithoutAccounts.length} users without accounts`
      );
    }

    const accountsWithoutTokens = accounts.filter((a) => !a.access_token);
    if (accountsWithoutTokens.length > 0) {
      console.log(
        `  ⚠️  ${accountsWithoutTokens.length} accounts without access tokens`
      );
    }

    const expiredSessions = sessions.filter((s) => s.expires <= new Date());
    if (expiredSessions.length > 0) {
      console.log(`  ⚠️  ${expiredSessions.length} expired sessions`);
    }

    const expiredAccounts = accounts.filter(
      (a) => a.expires_at && a.expires_at <= Math.floor(Date.now() / 1000)
    );
    if (expiredAccounts.length > 0) {
      console.log(`  ⚠️  ${expiredAccounts.length} expired accounts`);
    }

    if (
      usersWithoutAccounts.length === 0 &&
      accountsWithoutTokens.length === 0 &&
      expiredSessions.length === 0 &&
      expiredAccounts.length === 0
    ) {
      console.log("  ✅ No issues detected");
    }
  } catch (error) {
    console.error("❌ Database check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
