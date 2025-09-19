import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile from session
    const userProfile = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    };

    // Try to get additional profile info from connected services
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: session.user.id },
        select: {
          provider: true,
          access_token: true,
          expires_at: true,
        },
      });

      // Check if we have a valid Spotify token to get display name
      const spotifyAccount = accounts.find(
        (account) =>
          account.provider === "spotify" &&
          account.access_token &&
          (!account.expires_at || Date.now() / 1000 < account.expires_at - 300)
      );

      if (spotifyAccount) {
        try {
          const response = await fetch("https://api.spotify.com/v1/me", {
            headers: {
              Authorization: `Bearer ${spotifyAccount.access_token}`,
            },
          });

          if (response.ok) {
            const spotifyProfile = await response.json();
            // Prefer Spotify display name if available
            if (spotifyProfile.display_name) {
              userProfile.name = spotifyProfile.display_name;
            }
          }
        } catch (error) {
          console.error("Error fetching Spotify profile:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching account info:", error);
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
