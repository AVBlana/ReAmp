import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../../page";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

// Mock the auth context
jest.mock("@/app/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the router
jest.mock("next/navigation");
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();

describe("Landing Page Accessibility", () => {
  const mockSignIn = jest.fn();

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

  it("should show landing page for unauthenticated users", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
      user: null,
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    render(<Home />);

    expect(screen.getByText("ReAMP")).toBeInTheDocument();
    expect(screen.getByText("Continue with Spotify")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect your accounts to access Spotify and YouTube features"
      )
    ).toBeInTheDocument();
  });

  it("should redirect authenticated users to reamp", async () => {
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

    render(<Home />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/reamp");
    });
  });

  it("should show loading state while checking authentication", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      signIn: mockSignIn,
      signOut: jest.fn(),
      user: null,
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    render(<Home />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should allow signing in with Spotify from landing page", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
      user: null,
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    render(<Home />);

    const spotifyButton = screen.getByText("Continue with Spotify");
    fireEvent.click(spotifyButton);

    expect(mockSignIn).toHaveBeenCalledWith("spotify");
  });

  it("should allow signing in with Google from landing page", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
      user: null,
      session: null,
      getSpotifyToken: jest.fn(),
      getGoogleToken: jest.fn(),
    });

    render(<Home />);

    const googleButton = screen.getByText("Continue with Google");
    fireEvent.click(googleButton);

    expect(mockSignIn).toHaveBeenCalledWith("google");
  });

  it("should show landing page even for authenticated users who navigate back", () => {
    // Simulate authenticated user navigating back to landing page
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

    render(<Home />);

    // Should still show landing page content (even though it will redirect)
    expect(screen.getByText("ReAMP")).toBeInTheDocument();
    expect(screen.getByText("Continue with Spotify")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("should allow connecting additional accounts from landing page", () => {
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

    render(<Home />);

    // User can still click signin buttons to connect additional accounts
    const spotifyButton = screen.getByText("Continue with Spotify");
    fireEvent.click(spotifyButton);

    expect(mockSignIn).toHaveBeenCalledWith("spotify");
  });
});
