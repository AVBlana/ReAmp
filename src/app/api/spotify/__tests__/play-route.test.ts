import { NextRequest } from "next/server";
import { POST } from "../play/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mock dependencies
jest.mock("@/lib/auth");
jest.mock("@/lib/prisma");

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

// Mock fetch
global.fetch = jest.fn();

describe("/api/spotify/play", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/spotify/play", {
      method: "POST",
      body: JSON.stringify({ trackId: "test-track-id" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when Spotify is not connected", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-id" },
    } as any);

    mockPrisma.account.findFirst.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/spotify/play", {
      method: "POST",
      body: JSON.stringify({ trackId: "test-track-id" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Spotify not connected");
  });

  it("returns 400 when trackId is missing", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-id" },
    } as any);

    mockPrisma.account.findFirst.mockResolvedValue({
      access_token: "access-token",
      expires_at: Date.now() / 1000 + 3600, // 1 hour from now
    } as any);

    const request = new NextRequest("http://localhost:3000/api/spotify/play", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Track ID is required");
  });

  it("successfully plays track when all conditions are met", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-id" },
    } as any);

    mockPrisma.account.findFirst.mockResolvedValue({
      access_token: "access-token",
      expires_at: Date.now() / 1000 + 3600, // 1 hour from now
    } as any);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const request = new NextRequest("http://localhost:3000/api/spotify/play", {
      method: "POST",
      body: JSON.stringify({ trackId: "test-track-id" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/me/player/play",
      expect.objectContaining({
        method: "PUT",
        headers: {
          Authorization: "Bearer access-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: ["spotify:track:test-track-id"],
        }),
      })
    );
  });

  it("includes device_id in URL when provided", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-id" },
    } as any);

    mockPrisma.account.findFirst.mockResolvedValue({
      access_token: "access-token",
      expires_at: Date.now() / 1000 + 3600, // 1 hour from now
    } as any);

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    const request = new NextRequest("http://localhost:3000/api/spotify/play", {
      method: "POST",
      body: JSON.stringify({
        trackId: "test-track-id",
        deviceId: "test-device-id",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.spotify.com/v1/me/player/play?device_id=test-device-id",
      expect.any(Object)
    );
  });

  it("returns 401 when Spotify token is expired", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-id" },
    } as any);

    mockPrisma.account.findFirst.mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_at: Date.now() / 1000 - 3600, // 1 hour ago
    } as any);

    const request = new NextRequest("http://localhost:3000/api/spotify/play", {
      method: "POST",
      body: JSON.stringify({ trackId: "test-track-id" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Spotify token expired, please reconnect");
  });
});
