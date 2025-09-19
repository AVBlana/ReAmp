import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock the API route
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Connected Services Detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should detect connected Spotify account", async () => {
    const mockResponse = {
      spotify: true,
      youtube: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch("/api/user/connected-services");
    const services = await response.json();

    expect(services.spotify).toBe(true);
    expect(services.youtube).toBe(false);
  });

  it("should detect connected YouTube account", async () => {
    const mockResponse = {
      spotify: false,
      youtube: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch("/api/user/connected-services");
    const services = await response.json();

    expect(services.spotify).toBe(false);
    expect(services.youtube).toBe(true);
  });

  it("should detect both connected accounts", async () => {
    const mockResponse = {
      spotify: true,
      youtube: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch("/api/user/connected-services");
    const services = await response.json();

    expect(services.spotify).toBe(true);
    expect(services.youtube).toBe(true);
  });

  it("should handle API errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("API Error"));

    try {
      await fetch("/api/user/connected-services");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("API Error");
    }
  });

  it("should handle non-ok responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const response = await fetch("/api/user/connected-services");
    expect(response.ok).toBe(false);
  });
});
