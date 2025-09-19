import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Home from "@/app/page";

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AuthContext
jest.mock("@/app/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

const mockSignIn = jest.fn();

describe("Landing Page as Sign-In Hub", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      signIn: mockSignIn,
    });
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          connectedServices: { spotify: false, youtube: false },
        }),
    });
  });

  it("renders connect buttons for Spotify and Google", () => {
    render(<Home />);

    expect(screen.getByText("Connect Spotify")).toBeInTheDocument();
    expect(screen.getByText("Connect Google")).toBeInTheDocument();
  });

  it("calls signIn with landing page callbackUrl when Spotify connect is clicked", () => {
    render(<Home />);

    const spotifyButton = screen.getByText("Connect Spotify");
    fireEvent.click(spotifyButton);

    expect(mockSignIn).toHaveBeenCalledWith("spotify", {
      callbackUrl: expect.stringContaining("/?connected=spotify"),
    });
  });

  it("calls signIn with landing page callbackUrl when Google connect is clicked", () => {
    render(<Home />);

    const googleButton = screen.getByText("Connect Google");
    fireEvent.click(googleButton);

    expect(mockSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: expect.stringContaining("/?connected=google"),
    });
  });

  it("handles OAuth callback by fetching connected services and cleaning URL", async () => {
    mockSearchParams.get.mockReturnValue("spotify");
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          connectedServices: { spotify: true, youtube: false },
        }),
    });

    render(<Home />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/connected-services");
      expect(mockRouter.replace).toHaveBeenCalledWith("/", { scroll: false });
    });
  });

  it("shows success toast when service is connected via OAuth callback", async () => {
    mockSearchParams.get.mockReturnValue("spotify");
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          connectedServices: { spotify: true, youtube: false },
        }),
    });

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByText("Spotify connected successfully!")
      ).toBeInTheDocument();
    });
  });

  it('enables "Drop a beat!" button when at least one service is connected', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          connectedServices: { spotify: true, youtube: false },
        }),
    });

    render(<Home />);

    await waitFor(() => {
      const dropBeatButton = screen.getByText("🎵 Drop a beat!");
      expect(dropBeatButton).not.toBeDisabled();
    });
  });

  it('navigates to /reamp when "Drop a beat!" is clicked and services are connected', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({
          success: true,
          connectedServices: { spotify: true, youtube: false },
        }),
    });

    render(<Home />);

    await waitFor(() => {
      const dropBeatButton = screen.getByText("🎵 Drop a beat!");
      expect(dropBeatButton).not.toBeDisabled();
    });

    const dropBeatButton = screen.getByText("🎵 Drop a beat!");
    fireEvent.click(dropBeatButton);

    expect(mockRouter.push).toHaveBeenCalledWith("/reamp");
  });

  it("does not auto-redirect authenticated users away from landing page", () => {
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      signIn: mockSignIn,
    });

    render(<Home />);

    // Should not have called router.push with /reamp
    expect(mockRouter.push).not.toHaveBeenCalledWith("/reamp");

    // Landing page should still be rendered
    expect(screen.getByText("Connect Spotify")).toBeInTheDocument();
  });
});
