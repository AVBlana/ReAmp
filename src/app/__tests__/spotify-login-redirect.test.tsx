import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useSession, signIn } from "next-auth/react";
import { AuthProvider } from "@/app/context/AuthContext";

// Mock NextAuth
jest.mock("next-auth/react");
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

// Mock the landing page component
const MockLandingPage = () => {
  const { signIn } = React.useContext(
    require("@/app/context/AuthContext").AuthContext
  );

  return (
    <div>
      <button onClick={() => signIn("spotify")}>Sign in with Spotify</button>
      <button onClick={() => signIn("google")}>Sign in with Google</button>
    </div>
  );
};

describe("Spotify Login Redirect - Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should redirect to /reamp after Spotify login", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    mockSignIn.mockImplementation((provider, options) => {
      // Simulate successful login redirect
      expect(options?.callbackUrl).toBe("/reamp");
      return Promise.resolve(undefined);
    });

    render(
      <AuthProvider>
        <MockLandingPage />
      </AuthProvider>
    );

    const spotifyButton = screen.getByText("Sign in with Spotify");
    fireEvent.click(spotifyButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("spotify", {
        callbackUrl: "/reamp",
      });
    });
  });

  it("should redirect to /reamp after Google login", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    mockSignIn.mockImplementation((provider, options) => {
      // Simulate successful login redirect
      expect(options?.callbackUrl).toBe("/reamp");
      return Promise.resolve(undefined);
    });

    render(
      <AuthProvider>
        <MockLandingPage />
      </AuthProvider>
    );

    const googleButton = screen.getByText("Sign in with Google");
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/reamp",
      });
    });
  });

  it("should handle signIn errors gracefully", async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockSignIn.mockRejectedValueOnce(new Error("Sign in failed"));

    render(
      <AuthProvider>
        <MockLandingPage />
      </AuthProvider>
    );

    const spotifyButton = screen.getByText("Sign in with Spotify");
    fireEvent.click(spotifyButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("spotify", {
        callbackUrl: "/reamp",
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Sign in error:",
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it("should maintain session state after successful login", async () => {
    const mockSession = {
      user: { name: "Test User", email: "test@example.com" },
      providers: {
        spotify: { accessToken: "mock-token" },
      },
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: "authenticated",
      update: jest.fn(),
    });

    render(
      <AuthProvider>
        <MockLandingPage />
      </AuthProvider>
    );

    // Should not show sign in buttons when authenticated
    expect(screen.queryByText("Sign in with Spotify")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign in with Google")).not.toBeInTheDocument();
  });

  it("should handle loading state during authentication", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
      update: jest.fn(),
    });

    render(
      <AuthProvider>
        <MockLandingPage />
      </AuthProvider>
    );

    // Should show loading state
    expect(screen.queryByText("Sign in with Spotify")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign in with Google")).not.toBeInTheDocument();
  });
});
