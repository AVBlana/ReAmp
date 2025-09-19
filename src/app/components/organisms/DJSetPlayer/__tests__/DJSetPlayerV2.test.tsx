import React from "react";
import { render, screen } from "@testing-library/react";
import DJSetPlayerV2 from "../DJSetPlayerV2";
import { UnifiedProvider } from "@/app/context/UnifiedContext";
import { NotificationProvider } from "@/app/context/NotificationContext";

// Mock the hooks and context
jest.mock("@/app/hooks/useUnifiedPlayer", () => ({
  useUnifiedPlayer: () => ({
    isInitialized: true,
    playerStates: {},
    loadTrack: jest.fn(),
    playDeck: jest.fn(),
    pauseDeck: jest.fn(),
    stopDeck: jest.fn(),
    setDeckVolume: jest.fn(),
    seekDeck: jest.fn(),
    startCrossfade: jest.fn(),
    isCrossfadeActive: jest.fn(() => false),
    getDeckState: jest.fn(() => ({
      service: null,
      currentTrack: null,
      isPlaying: false,
      isReady: false,
    })),
    isDeckReady: jest.fn(() => false),
    isDeckPlaying: jest.fn(() => false),
    hasTrack: jest.fn(() => false),
  }),
}));

jest.mock("@/app/hooks/useSmartCrossfade", () => ({
  useSmartCrossfade: () => ({
    crossfadeEnabled: false,
    crossfadeDuration: 5000,
    autoCrossfadeThreshold: 10000,
    minTimeRemaining: 5000,
    toggleCrossfade: jest.fn(),
    triggerManualCrossfade: jest.fn(),
    setCrossfadeDurationMs: jest.fn(),
    setAutoCrossfadeThresholdMs: jest.fn(),
    setMinTimeRemainingMs: jest.fn(),
    canCrossfade: jest.fn(() => false),
    getCrossfadeSuggestions: jest.fn(() => []),
  }),
}));

jest.mock("@/app/context/UnifiedContext", () => ({
  useUnifiedContext: () => ({
    youtube: {
      searchResults: [],
      setSearchResults: jest.fn(),
      setNextPageToken: jest.fn(),
      setCurrentSearchTerm: jest.fn(),
    },
    spotify: {
      searchResults: [],
      setSearchResults: jest.fn(),
      setNextPageToken: jest.fn(),
      setCurrentSearchTerm: jest.fn(),
    },
    unified: { playlist: [], addToPlaylist: jest.fn() },
  }),
  UnifiedProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <NotificationProvider>
      <UnifiedProvider>{component}</UnifiedProvider>
    </NotificationProvider>
  );
};

describe("DJSetPlayerV2", () => {
  test("should display default greeting when no userName provided", () => {
    renderWithProviders(<DJSetPlayerV2 />);

    expect(screen.getByText("Welcome DJ, drop a track!")).toBeInTheDocument();
  });

  test("should display personalized greeting when userName provided", () => {
    renderWithProviders(<DJSetPlayerV2 userName="John Doe" />);

    expect(
      screen.getByText("Welcome John Doe, drop a track!")
    ).toBeInTheDocument();
  });

  test("should display personalized greeting with Spotify display name", () => {
    renderWithProviders(<DJSetPlayerV2 userName="SpotifyUser123" />);

    expect(
      screen.getByText("Welcome SpotifyUser123, drop a track!")
    ).toBeInTheDocument();
  });

  test("should fallback to DJ when userName is null", () => {
    renderWithProviders(<DJSetPlayerV2 userName={null} />);

    expect(screen.getByText("Welcome DJ, drop a track!")).toBeInTheDocument();
  });

  test("should fallback to DJ when userName is empty string", () => {
    renderWithProviders(<DJSetPlayerV2 userName="" />);

    expect(screen.getByText("Welcome DJ, drop a track!")).toBeInTheDocument();
  });
});
