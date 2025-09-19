import { renderHook, act } from "@testing-library/react";
import { useSmartCrossfade } from "../useSmartCrossfade";

// Mock the player states
const mockPlayerStates = {
  A: {
    isReady: true,
    isPlaying: true,
    currentTrack: { id: "track1", title: "Track 1" },
    duration: 30000, // 30 seconds
    currentTime: 25000, // 25 seconds (5 seconds remaining)
  },
  B: {
    isReady: true,
    isPlaying: false,
    currentTrack: { id: "track2", title: "Track 2" },
    duration: 30000, // 30 seconds
    currentTime: 0,
  },
};

const mockStartCrossfade = jest.fn();
const mockIsCrossfadeActive = jest.fn(() => false);

describe("Crossfade Behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should not trigger auto-crossfade when crossfade is disabled", () => {
    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: mockPlayerStates,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActive,
      })
    );

    // Crossfade should be disabled by default
    expect(result.current.crossfadeEnabled).toBe(false);

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not trigger crossfade
    expect(mockStartCrossfade).not.toHaveBeenCalled();
  });

  it("should trigger auto-crossfade when crossfade is enabled", async () => {
    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: mockPlayerStates,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActive,
      })
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    expect(result.current.crossfadeEnabled).toBe(true);

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should trigger crossfade since track A has 5 seconds remaining
    expect(mockStartCrossfade).toHaveBeenCalledWith("A", "B", 2000);
  });

  it("should not trigger crossfade when already active", () => {
    const mockIsCrossfadeActiveActive = jest.fn(() => true);

    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: mockPlayerStates,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActiveActive,
      })
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not trigger crossfade since one is already active
    expect(mockStartCrossfade).not.toHaveBeenCalled();
  });

  it("should not trigger crossfade when time remaining is outside threshold", () => {
    const playerStatesWithLongTimeRemaining = {
      ...mockPlayerStates,
      A: {
        ...mockPlayerStates.A,
        currentTime: 5000, // 25 seconds remaining (outside 8 second threshold)
      },
    };

    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: playerStatesWithLongTimeRemaining,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActive,
      })
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not trigger crossfade since time remaining is outside threshold
    expect(mockStartCrossfade).not.toHaveBeenCalled();
  });

  it("should not trigger crossfade when time remaining is below minimum", () => {
    const playerStatesWithShortTimeRemaining = {
      ...mockPlayerStates,
      A: {
        ...mockPlayerStates.A,
        currentTime: 29500, // 0.5 seconds remaining (below 2 second minimum)
      },
    };

    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: playerStatesWithShortTimeRemaining,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActive,
      })
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not trigger crossfade since time remaining is below minimum
    expect(mockStartCrossfade).not.toHaveBeenCalled();
  });

  it("should respect cooldown period between crossfades", () => {
    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: mockPlayerStates,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActive,
      })
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // First crossfade
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockStartCrossfade).toHaveBeenCalledTimes(1);

    // Advance time but not enough to clear cooldown (5 seconds)
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Should not trigger another crossfade due to cooldown
    expect(mockStartCrossfade).toHaveBeenCalledTimes(1);

    // Advance past cooldown period
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should trigger another crossfade
    expect(mockStartCrossfade).toHaveBeenCalledTimes(2);
  });

  it("should allow manual crossfade trigger", async () => {
    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: mockPlayerStates,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActive,
      })
    );

    // Trigger manual crossfade
    await act(async () => {
      await result.current.triggerManualCrossfade();
    });

    expect(mockStartCrossfade).toHaveBeenCalledWith("A", "B", 2000);
  });

  it("should not allow manual crossfade when already active", async () => {
    const mockIsCrossfadeActiveActive = jest.fn(() => true);

    const { result } = renderHook(() =>
      useSmartCrossfade({
        playerStates: mockPlayerStates,
        startCrossfade: mockStartCrossfade,
        isCrossfadeActive: mockIsCrossfadeActiveActive,
      })
    );

    // Try to trigger manual crossfade
    await act(async () => {
      await result.current.triggerManualCrossfade();
    });

    // Should not trigger crossfade since one is already active
    expect(mockStartCrossfade).not.toHaveBeenCalled();
  });
});
