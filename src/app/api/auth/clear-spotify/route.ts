import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Next.js route signature
export async function POST(request: NextRequest) {
  try {
    // Get the session using the auth handler
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("🔍 Session user ID:", session.user.id);

    // Delete the Spotify account from the database
    const result = await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: "spotify",
      },
    });

    console.log("🗑️ Cleared Spotify account data:", result);

    return NextResponse.json({
      success: true,
      message: "Spotify account data cleared. Please sign in again.",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("❌ Error clearing Spotify account:", error);
    return NextResponse.json(
      {
        error: "Failed to clear account",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
