import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignInPage from "../page";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

// Mock the auth context
jest.mock("@/app/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the router
jest.mock("next/navigation");
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();

// Mock fetch
global.fetch = jest.fn();

describe("SignInPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    } as any);
  });

  test("should be accessible when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      user: null,
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    render(<SignInPage />);

    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
    expect(screen.getByText("Continue with Spotify")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  test("should be accessible when user is authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      user: { name: "John Doe", email: "john@example.com" },
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    // Mock connected services API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ spotify: true, youtube: false }),
    });

    render(<SignInPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Connect Additional Accounts")
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Connected Services")).toBeInTheDocument();
    expect(screen.getByText("Go to Music Player")).toBeInTheDocument();
  });

  test("should show connected services status for authenticated users", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      user: { name: "John Doe", email: "john@example.com" },
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    // Mock connected services API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ spotify: true, youtube: false }),
    });

    render(<SignInPage />);

    await waitFor(() => {
      expect(screen.getByText("Spotify")).toBeInTheDocument();
      expect(screen.getByText("YouTube (Google)")).toBeInTheDocument();
    });

    // Should show Spotify as connected and YouTube as not connected
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Not Connected")).toBeInTheDocument();
  });

  test("should allow connecting additional accounts without sign out", () => {
    const mockSignIn = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
      user: { name: "John Doe", email: "john@example.com" },
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    // Mock connected services API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ spotify: false, youtube: true }),
    });

    render(<SignInPage />);

    const spotifyButton = screen.getByText("Continue with Spotify");
    fireEvent.click(spotifyButton);

    expect(mockSignIn).toHaveBeenCalledWith("spotify");
  });

  test("should navigate to reamp when Go to Music Player is clicked", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signOut: jest.fn(),
      user: { name: "John Doe", email: "john@example.com" },
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    // Mock connected services API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ spotify: true, youtube: true }),
    });

    render(<SignInPage />);

    const goToPlayerButton = screen.getByText("Go to Music Player");
    fireEvent.click(goToPlayerButton);

    expect(mockPush).toHaveBeenCalledWith("/reamp");
  });
});
