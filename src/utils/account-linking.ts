import { prisma } from "@/lib/prisma";
import type { UserWithAccounts, LinkedAccount } from "@/types/auth";

/**
 * Links a new OAuth account to an existing user
 */
export async function linkAccountToUser(
  userId: string,
  accountData: {
    provider: string;
    providerAccountId: string;
    type: string;
    access_token?: string | null;
    refresh_token?: string | null;
    expires_at?: number | null;
    token_type?: string | null;
    scope?: string | null;
    id_token?: string | null;
    session_state?: string | null;
  }
): Promise<LinkedAccount> {
  try {
    const account = await prisma.account.create({
      data: {
        userId,
        type: accountData.type,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        refresh_token: accountData.refresh_token,
        access_token: accountData.access_token,
        expires_at: accountData.expires_at,
        token_type: accountData.token_type,
        scope: accountData.scope,
        id_token: accountData.id_token,
        session_state: accountData.session_state,
      },
    });

    return {
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      accessToken: account.access_token,
      refreshToken: account.refresh_token,
      expiresAt: account.expires_at,
    };
  } catch (error) {
    console.error("Error linking account to user:", error);
    throw new Error("Failed to link account to user");
  }
}

/**
 * Gets a user with all their linked accounts
 */
export async function getUserWithAccounts(
  email: string
): Promise<UserWithAccounts | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            access_token: true,
            refresh_token: true,
            expires_at: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      accounts: user.accounts.map((account) => ({
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        accessToken: account.access_token,
        refreshToken: account.refresh_token,
        expiresAt: account.expires_at,
      })),
    };
  } catch (error) {
    console.error("Error getting user with accounts:", error);
    throw new Error("Failed to get user with accounts");
  }
}

/**
 * Checks if a provider account is already linked to a user
 */
export async function isAccountLinked(
  provider: string,
  providerAccountId: string
): Promise<boolean> {
  try {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    });

    return !!account;
  } catch (error) {
    console.error("Error checking if account is linked:", error);
    return false;
  }
}

/**
 * Gets all users with a specific email (for debugging account linking issues)
 */
export async function getAllUsersWithEmail(email: string) {
  try {
    const users = await prisma.user.findMany({
      where: { email },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            createdAt: true,
          },
        },
      },
    });

    return users;
  } catch (error) {
    console.error("Error getting all users with email:", error);
    return [];
  }
}
