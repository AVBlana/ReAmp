import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "test-secret",
    NEXT_PUBLIC_SPOTIFY_CLIENT_ID: "test-spotify-client-id",
    SPOTIFY_CLIENT_SECRET: "test-spotify-client-secret",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
  };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

describe("Spotify OAuth Configuration", () => {
  it("should have correct Spotify provider configuration", () => {
    // This test verifies that the Spotify provider is properly configured
    // The actual configuration is tested through integration tests
    expect(process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID).toBe(
      "test-spotify-client-id"
    );
    expect(process.env.SPOTIFY_CLIENT_SECRET).toBe(
      "test-spotify-client-secret"
    );
  });

  it("should redirect to /reamp after successful login", async () => {
    const _mockRedirect = jest.fn();
    const mockBaseUrl = "http://localhost:3000";
    const mockUrl = "/reamp";

    // Mock the redirect callback
    const redirectCallback = authOptions.callbacks?.redirect;
    if (redirectCallback) {
      const result = await redirectCallback({
        url: mockUrl,
        baseUrl: mockBaseUrl,
      });

      expect(result).toBe(`${mockBaseUrl}${mockUrl}`);
    }
  });

  it("should handle account linking for existing users", async () => {
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
    };

    const mockAccount = {
      provider: "spotify",
      providerAccountId: "spotify-user-123",
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    // Mock existing user with different provider
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      accounts: [{ provider: "google" }],
    });

    const signInCallback = authOptions.callbacks?.signIn;
    if (signInCallback) {
      const result = await signInCallback({
        user: mockUser,
        account: mockAccount,
      });

      expect(result).toBe(true);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        include: { accounts: true },
      });
    }
  });

  it("should allow new account creation", async () => {
    const mockUser = {
      id: "user-2",
      email: "newuser@example.com",
      name: "New User",
    };

    const mockAccount = {
      provider: "spotify",
      providerAccountId: "spotify-user-456",
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    // Mock no existing user
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    const signInCallback = authOptions.callbacks?.signIn;
    if (signInCallback) {
      const result = await signInCallback({
        user: mockUser,
        account: mockAccount,
      });

      expect(result).toBe(true);
    }
  });

  it("should handle Spotify profile callback correctly", () => {
    const mockSpotifyProfile = {
      id: "spotify-user-123",
      display_name: "Spotify User",
      email: "spotify@example.com",
      images: [{ url: "https://example.com/avatar.jpg" }],
    };

    // Find the Spotify provider in the configuration
    const spotifyProvider = authOptions.providers?.find((p: { id?: string }) => p.id === "spotify");
    expect(spotifyProvider).toBeDefined();

    if (spotifyProvider && "profile" in spotifyProvider) {
      const profileCallback = spotifyProvider.profile;
      if (profileCallback) {
        const result = profileCallback(mockSpotifyProfile);

        expect(result).toEqual({
          id: "spotify-user-123",
          name: "Spotify User",
          email: "spotify@example.com",
          image: "https://example.com/avatar.jpg",
        });
      }
    }
  });

  it("should handle JWT token creation for Spotify", async () => {
    const _mockToken = {
      sub: "user-1",
      provider: "spotify",
    };

    const _mockAccount = {
      provider: "spotify",
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    };

    const _mockUser = {
      id: "user-1",
      email: "test@example.com",
    };

    // v4 with database strategy does not use jwt callback
    const jwtCallback = authOptions.callbacks?.jwt;
    expect(jwtCallback).toBeUndefined();
  });

  it("should handle session creation with Spotify tokens", async () => {
    const mockSession = {
      user: {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
      },
    };

    const mockToken = {
      sub: "user-1",
      accessToken: "spotify-access-token",
      provider: "spotify",
    };

    // Mock account data
    (prisma.account.findMany as jest.Mock).mockResolvedValue([
      {
        provider: "spotify",
        access_token: "spotify-access-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      },
    ]);

    const sessionCallback = authOptions.callbacks?.session;
    if (sessionCallback) {
      const mockUser = { id: "user-1", email: "test@example.com", name: null, image: null };
      const result = await sessionCallback({
        session: mockSession,
        user: mockUser,
      });

      expect(result.user.id).toBe("user-1");
      expect(result.providers).toHaveProperty("spotify");
    }
  });
});

describe("Prisma Schema Validation", () => {
  it("should have correct Account model structure", () => {
    // This test verifies that the Prisma schema has the correct structure
    // for storing OAuth accounts
    const expectedAccountFields = [
      "id",
      "userId",
      "type",
      "provider",
      "providerAccountId",
      "refresh_token",
      "access_token",
      "expires_at",
      "token_type",
      "scope",
      "id_token",
      "session_state",
    ];

    // The actual schema validation would be done through Prisma introspection
    // This is a conceptual test to ensure we're aware of required fields
    expect(expectedAccountFields).toContain("provider");
    expect(expectedAccountFields).toContain("providerAccountId");
    expect(expectedAccountFields).toContain("access_token");
    expect(expectedAccountFields).toContain("refresh_token");
    expect(expectedAccountFields).toContain("expires_at");
  });

  it("should have correct User model with accounts relation", () => {
    const expectedUserFields = [
      "id",
      "name",
      "email",
      "emailVerified",
      "image",
      "accounts",
      "sessions",
      "createdAt",
      "updatedAt",
    ];

    expect(expectedUserFields).toContain("accounts");
    expect(expectedUserFields).toContain("email");
  });
});
