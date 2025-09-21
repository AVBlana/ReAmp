import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";

// Mock Prisma
const mockPrisma = {
  account: {
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

// Mock the auth module
jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock fetch for token refresh
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Revoked Token Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should clean up revoked Spotify account from database", async () => {
    // Mock a revoked token response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        '{"error":"invalid_grant","error_description":"Refresh token revoked"}',
    });

    // Mock database accounts with expired token and refresh token
    const mockAccounts = [
      {
        provider: "spotify",
        providerAccountId: "spotify_user_123",
        access_token: "expired_token",
        refresh_token: "revoked_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      },
    ];

    mockPrisma.account.findMany.mockResolvedValue(mockAccounts);
    mockPrisma.account.deleteMany.mockResolvedValue({ count: 1 });

    // Import the auth module after mocking
    const { auth } = await import("@/lib/auth");

    // Mock session data
    const mockSession = {
      user: { id: "user123", email: "test@example.com" },
      providers: { spotify: undefined, google: undefined },
    };

    // Call the session callback
    const sessionCallback = auth.callbacks?.session;
    if (sessionCallback) {
      const result = await sessionCallback({
        session: mockSession,
        user: { id: "user123" },
      });

      // Verify that the revoked account was cleaned up
      expect(mockPrisma.account.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "user123",
          provider: "spotify",
          providerAccountId: "spotify_user_123",
        },
      });

      // Verify that Spotify provider is not added to session
      expect(result.providers.spotify).toBeUndefined();
    }
  });

  it("should handle network errors without cleaning up account", async () => {
    // Mock a network error
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    // Mock database accounts
    const mockAccounts = [
      {
        provider: "spotify",
        providerAccountId: "spotify_user_123",
        access_token: "expired_token",
        refresh_token: "valid_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      },
    ];

    mockPrisma.account.findMany.mockResolvedValue(mockAccounts);

    // Import the auth module after mocking
    const { auth } = await import("@/lib/auth");

    // Mock session data
    const mockSession = {
      user: { id: "user123", email: "test@example.com" },
      providers: { spotify: undefined, google: undefined },
    };

    // Call the session callback
    const sessionCallback = auth.callbacks?.session;
    if (sessionCallback) {
      const result = await sessionCallback({
        session: mockSession,
        user: { id: "user123" },
      });

      // Verify that the account was NOT cleaned up for network errors
      expect(mockPrisma.account.deleteMany).not.toHaveBeenCalled();

      // Verify that Spotify provider is not added to session
      expect(result.providers.spotify).toBeUndefined();
    }
  });

  it("should handle invalid_grant error and clean up account", async () => {
    // Mock an invalid_grant response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        '{"error":"invalid_grant","error_description":"Invalid refresh token"}',
    });

    // Mock database accounts
    const mockAccounts = [
      {
        provider: "spotify",
        providerAccountId: "spotify_user_123",
        access_token: "expired_token",
        refresh_token: "invalid_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      },
    ];

    mockPrisma.account.findMany.mockResolvedValue(mockAccounts);
    mockPrisma.account.deleteMany.mockResolvedValue({ count: 1 });

    // Import the auth module after mocking
    const { auth } = await import("@/lib/auth");

    // Mock session data
    const mockSession = {
      user: { id: "user123", email: "test@example.com" },
      providers: { spotify: undefined, google: undefined },
    };

    // Call the session callback
    const sessionCallback = auth.callbacks?.session;
    if (sessionCallback) {
      const result = await sessionCallback({
        session: mockSession,
        user: { id: "user123" },
      });

      // Verify that the invalid account was cleaned up
      expect(mockPrisma.account.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: "user123",
          provider: "spotify",
          providerAccountId: "spotify_user_123",
        },
      });

      // Verify that Spotify provider is not added to session
      expect(result.providers.spotify).toBeUndefined();
    }
  });

  it("should successfully refresh valid tokens", async () => {
    // Mock a successful token refresh
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new_access_token",
        expires_in: 3600,
      }),
    });

    // Mock database accounts
    const mockAccounts = [
      {
        provider: "spotify",
        providerAccountId: "spotify_user_123",
        access_token: "expired_token",
        refresh_token: "valid_refresh_token",
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      },
    ];

    mockPrisma.account.findMany.mockResolvedValue(mockAccounts);
    mockPrisma.account.update.mockResolvedValue({});

    // Import the auth module after mocking
    const { auth } = await import("@/lib/auth");

    // Mock session data
    const mockSession = {
      user: { id: "user123", email: "test@example.com" },
      providers: { spotify: undefined, google: undefined },
    };

    // Call the session callback
    const sessionCallback = auth.callbacks?.session;
    if (sessionCallback) {
      const result = await sessionCallback({
        session: mockSession,
        user: { id: "user123" },
      });

      // Verify that the account was updated with new token
      expect(mockPrisma.account.update).toHaveBeenCalledWith({
        where: {
          provider_providerAccountId: {
            provider: "spotify",
            providerAccountId: "spotify_user_123",
          },
        },
        data: {
          access_token: "new_access_token",
          expires_at: expect.any(Number),
        },
      });

      // Verify that Spotify provider is added to session
      expect(result.providers.spotify).toBeDefined();
      expect(result.providers.spotify?.accessToken).toBe("new_access_token");
    }
  });
});
