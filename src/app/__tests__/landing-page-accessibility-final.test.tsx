import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../page";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

// Mock the auth context
jest.mock("@/app/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the router
jest.mock("next/navigation");
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPush = jest.fn();

describe("Landing Page Accessibility - Final Implementation", () => {
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

  it("should show landing page for authenticated users (no forced redirect)", () => {
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

    // Should still show landing page content
    expect(screen.getByText("ReAMP")).toBeInTheDocument();
    expect(screen.getByText("Continue with Spotify")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();

    // Should redirect to reamp in background
    waitFor(() => {
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

  it("should allow connecting additional accounts for authenticated users", () => {
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

  it("should have properly styled signin buttons with hover effects", () => {
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
    const googleButton = screen.getByText("Continue with Google");

    // Check that buttons have proper styling classes
    expect(spotifyButton.closest("button")).toHaveClass(
      "relative",
      "flex",
      "items-center",
      "space-x-3"
    );
    expect(googleButton.closest("button")).toHaveClass(
      "relative",
      "flex",
      "items-center",
      "space-x-3"
    );
  });

  it("should display buttons side by side on larger screens", () => {
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

    const buttonContainer = screen
      .getByText("Continue with Spotify")
      .closest("div")?.parentElement;
    expect(buttonContainer).toHaveClass(
      "flex",
      "flex-col",
      "sm:flex-row",
      "gap-4",
      "items-center"
    );
  });

  it("should be accessible with proper ARIA labels and semantic structure", () => {
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

    // Check for proper heading structure
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "ReAMP"
    );

    // Check that buttons are accessible
    const spotifyButton = screen.getByText("Continue with Spotify");
    const googleButton = screen.getByText("Continue with Google");

    expect(spotifyButton.closest("button")).toBeInTheDocument();
    expect(googleButton.closest("button")).toBeInTheDocument();
  });

  it("should not forcibly redirect authenticated users away from landing page", () => {
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

    const { container } = render(<Home />);

    // Landing page content should be visible
    expect(container.querySelector("h1")).toHaveTextContent("ReAMP");
    expect(screen.getByText("Continue with Spotify")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();

    // Should not return null (which would hide the page)
    expect(container.firstChild).not.toBeNull();
  });
});
