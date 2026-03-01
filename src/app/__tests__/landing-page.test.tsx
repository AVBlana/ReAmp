import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../page";
import { useAuth } from "@/app/context/AuthContext";

jest.mock("@/app/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

global.fetch = jest.fn();

describe("Landing Page", () => {
  const mockSignIn = jest.fn();
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it("should render Spotify button with proper brand colors", () => {
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

    const spotifyButton = screen
      .getByText("Continue with Spotify")
      .closest("button");

    expect(spotifyButton).toHaveClass("bg-[#1DB954]", "hover:bg-[#1AA34A]");
    expect(spotifyButton).toHaveClass(
      "border-[#1DB954]",
      "hover:border-[#1AA34A]"
    );
  });

  it("should render Google button with proper brand colors", () => {
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

    const googleButton = screen
      .getByText("Continue with Google")
      .closest("button");

    expect(googleButton).toHaveClass("bg-[#4285F4]", "hover:bg-[#3367D6]");
    expect(googleButton).toHaveClass(
      "border-[#4285F4]",
      "hover:border-[#3367D6]"
    );
  });

  it("should include Spotify icon on Spotify button", () => {
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

    const spotifyButton = screen
      .getByText("Continue with Spotify")
      .closest("button");
    const spotifyIcon = spotifyButton?.querySelector("svg");

    expect(spotifyIcon).toBeInTheDocument();
    expect(spotifyIcon).toHaveClass("text-white");
  });

  it("should include Google icon on Google button", () => {
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

    const googleButton = screen
      .getByText("Continue with Google")
      .closest("button");
    const googleIcon = googleButton?.querySelector("svg");

    expect(googleIcon).toBeInTheDocument();
    expect(googleIcon).toHaveClass("text-white");
  });

  it("should show 'Continue with' text for unauthenticated users", () => {
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

    expect(screen.getByText("Continue with Spotify")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("should show 'Connect' text for authenticated users without connected services", async () => {
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        connectedServices: { spotify: false, youtube: false },
      }),
    } as Response);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Connect Spotify")).toBeInTheDocument();
      expect(screen.getByText("Connect Google")).toBeInTheDocument();
    });

    expect(screen.queryByText("Continue with Spotify")).not.toBeInTheDocument();
    expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
  });

  it("should show 'Reconnect' text for authenticated users with connected services", async () => {
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        connectedServices: { spotify: true, youtube: true },
      }),
    } as Response);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Reconnect Spotify")).toBeInTheDocument();
      expect(screen.getByText("Reconnect Google")).toBeInTheDocument();
    });

    expect(screen.queryByText("Connect Spotify")).not.toBeInTheDocument();
    expect(screen.queryByText("Connect Google")).not.toBeInTheDocument();
  });

  it("should fetch connected services for authenticated users", async () => {
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        connectedServices: { spotify: true, youtube: false },
      }),
    } as Response);

    render(<Home />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/user/connected-services");
    });

    expect(screen.getByText("Reconnect Spotify")).toBeInTheDocument();
    expect(screen.getByText("Connect Google")).toBeInTheDocument();
  });

  it("should handle connected services API error gracefully", async () => {
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

    mockFetch.mockRejectedValueOnce(new Error("API Error"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<Home />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/user/connected-services");
    });

    expect(screen.getByText("Connect Spotify")).toBeInTheDocument();
    expect(screen.getByText("Connect Google")).toBeInTheDocument();

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching connected services:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should have proper hover effects and styling", () => {
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

    const spotifyButton = screen
      .getByText("Continue with Spotify")
      .closest("button");
    const googleButton = screen
      .getByText("Continue with Google")
      .closest("button");

    expect(spotifyButton).toHaveClass(
      "hover:bg-[#1AA34A]",
      "hover:border-[#1AA34A]"
    );
    expect(googleButton).toHaveClass(
      "hover:bg-[#3367D6]",
      "hover:border-[#3367D6]"
    );

    expect(spotifyButton).toHaveClass("shadow-lg", "hover:shadow-xl");
    expect(googleButton).toHaveClass("shadow-lg", "hover:shadow-xl");

    expect(spotifyButton).toHaveClass("rounded-2xl");
    expect(googleButton).toHaveClass("rounded-2xl");

    expect(spotifyButton).toHaveClass("transition-all", "duration-300");
    expect(googleButton).toHaveClass("transition-all", "duration-300");
  });

  it("should be responsive - side by side on desktop, stacked on mobile", () => {
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

  it("should be accessible with proper ARIA attributes", () => {
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

    expect(spotifyButton.closest("button")).toBeInTheDocument();
    expect(googleButton.closest("button")).toBeInTheDocument();

    expect(spotifyButton).toHaveTextContent("Continue with Spotify");
    expect(googleButton).toHaveTextContent("Continue with Google");
  });

  it("should call signIn with correct provider when clicked", () => {
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

    fireEvent.click(spotifyButton);
    expect(mockSignIn).toHaveBeenCalledWith("spotify");

    fireEvent.click(googleButton);
    expect(mockSignIn).toHaveBeenCalledWith("google");
  });

  it("should work for authenticated users connecting additional accounts", async () => {
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

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        connectedServices: { spotify: false, youtube: true },
      }),
    } as Response);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Connect Spotify")).toBeInTheDocument();
      expect(screen.getByText("Reconnect Google")).toBeInTheDocument();
    });

    const spotifyButton = screen.getByText("Connect Spotify");
    const googleButton = screen.getByText("Reconnect Google");

    fireEvent.click(spotifyButton);
    expect(mockSignIn).toHaveBeenCalledWith("spotify");

    fireEvent.click(googleButton);
    expect(mockSignIn).toHaveBeenCalledWith("google");
  });

  it("should have proper text styling", () => {
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

    const spotifyButton = screen
      .getByText("Continue with Spotify")
      .closest("button");
    const googleButton = screen
      .getByText("Continue with Google")
      .closest("button");

    const spotifyText = spotifyButton?.querySelector("span");
    const googleText = googleButton?.querySelector("span");

    expect(spotifyText).toHaveClass("text-white", "text-lg", "font-medium");
    expect(googleText).toHaveClass("text-white", "text-lg", "font-medium");
  });

  it("should have proper spacing and layout", () => {
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

    const spotifyButton = screen
      .getByText("Continue with Spotify")
      .closest("button");
    const googleButton = screen
      .getByText("Continue with Google")
      .closest("button");

    expect(spotifyButton).toHaveClass(
      "flex",
      "items-center",
      "space-x-3",
      "px-8",
      "py-4"
    );
    expect(googleButton).toHaveClass(
      "flex",
      "items-center",
      "space-x-3",
      "px-8",
      "py-4"
    );
  });
});
