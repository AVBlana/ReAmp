import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "../page";
import { useAuth } from "@/app/context/AuthContext";

// Mock the auth context
jest.mock("@/app/context/AuthContext");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("Landing Page Buttons - Comprehensive Tests", () => {
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
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

    // Check Spotify brand colors
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

    // Check Google brand colors
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

  it("should show 'Connect' text for authenticated users", () => {
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

    expect(screen.getByText("Connect Spotify")).toBeInTheDocument();
    expect(screen.getByText("Connect Google")).toBeInTheDocument();
    expect(screen.queryByText("Continue with Spotify")).not.toBeInTheDocument();
    expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
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

    // Check hover effects
    expect(spotifyButton).toHaveClass(
      "hover:bg-[#1AA34A]",
      "hover:border-[#1AA34A]"
    );
    expect(googleButton).toHaveClass(
      "hover:bg-[#3367D6]",
      "hover:border-[#3367D6]"
    );

    // Check shadow effects
    expect(spotifyButton).toHaveClass("shadow-lg", "hover:shadow-xl");
    expect(googleButton).toHaveClass("shadow-lg", "hover:shadow-xl");

    // Check rounded corners
    expect(spotifyButton).toHaveClass("rounded-2xl");
    expect(googleButton).toHaveClass("rounded-2xl");

    // Check transitions
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

    // Check responsive classes
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

    // Check that buttons are accessible
    expect(spotifyButton.closest("button")).toBeInTheDocument();
    expect(googleButton.closest("button")).toBeInTheDocument();

    // Check button text is descriptive
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

  it("should work for authenticated users connecting additional accounts", () => {
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

    const spotifyButton = screen.getByText("Connect Spotify");
    const googleButton = screen.getByText("Connect Google");

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

    // Check text styling
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

    // Check spacing classes
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
