import { NextRequest } from "next/server";
import { GET } from "../connected-services/route";

// Mock the auth and prisma modules
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findMany: jest.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("/api/user/connected-services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return connected services for authenticated user", async () => {
    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    } as any);

    // Mock database accounts
    mockPrisma.account.findMany.mockResolvedValue([
      {
        provider: "spotify",
        access_token: "spotify_token",
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      },
      {
        provider: "google",
        access_token: "google_token",
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/user/connected-services"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      spotify: true,
      youtube: true, // Google provider should be mapped to youtube
    });
  });

  test("should return false for expired tokens", async () => {
    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    } as any);

    // Mock database accounts with expired tokens
    mockPrisma.account.findMany.mockResolvedValue([
      {
        provider: "spotify",
        access_token: "spotify_token",
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      },
      {
        provider: "google",
        access_token: "google_token",
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/user/connected-services"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      spotify: false,
      youtube: false,
    });
  });

  test("should return false for missing tokens", async () => {
    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    } as any);

    // Mock database accounts without tokens
    mockPrisma.account.findMany.mockResolvedValue([
      {
        provider: "spotify",
        access_token: null,
        expires_at: null,
      },
      {
        provider: "google",
        access_token: null,
        expires_at: null,
      },
    ] as any);

    const request = new NextRequest(
      "http://localhost:3000/api/user/connected-services"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      spotify: false,
      youtube: false,
    });
  });

  test("should return 401 for unauthenticated user", async () => {
    // Mock unauthenticated session
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/user/connected-services"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  test("should handle database errors gracefully", async () => {
    // Mock authenticated session
    mockAuth.mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    } as any);

    // Mock database error
    mockPrisma.account.findMany.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest(
      "http://localhost:3000/api/user/connected-services"
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: "Internal server error" });
  });
});
