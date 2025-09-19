import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Test database connection
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accounts: true },
    });

    const allAccounts = await prisma.account.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
      },
      accounts: allAccounts.map((acc) => ({
        provider: acc.provider,
        hasAccessToken: !!acc.access_token,
        scope: acc.scope,
        expiresAt: acc.expires_at,
      })),
      totalAccounts: allAccounts.length,
    });
  } catch (error) {
    console.error("❌ Error testing database:", error);
    return NextResponse.json(
      {
        error: "Database error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
