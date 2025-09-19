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

describe("Crossfade Behavior - Comprehensive Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Clear console logs
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("should not trigger auto-crossfade when toggle is OFF", () => {
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

  it("should not trigger crossfade on initial page load", () => {
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

    // Should not trigger crossfade because no user action has occurred yet
    expect(mockStartCrossfade).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      "🚫 Auto-crossfade skipped: No user action detected"
    );
  });

  it("should not trigger crossfade on session restore", () => {
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

    // Simulate session restore by changing tracks without user action
    const sessionRestoreStates = {
      ...mockPlayerStates,
      A: {
        ...mockPlayerStates.A,
        currentTrack: { id: "restored_track", title: "Restored Track" },
      },
    };

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not trigger crossfade because no user action detected
    expect(mockStartCrossfade).not.toHaveBeenCalled();
  });

  it("should trigger crossfade only after user action (track change)", () => {
    const { result, rerender } = renderHook(
      ({ playerStates }) =>
        useSmartCrossfade({
          playerStates,
          startCrossfade: mockStartCrossfade,
          isCrossfadeActive: mockIsCrossfadeActive,
        }),
      {
        initialProps: { playerStates: mockPlayerStates },
      }
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Simulate user action by changing track
    const newPlayerStates = {
      ...mockPlayerStates,
      A: {
        ...mockPlayerStates.A,
        currentTrack: { id: "track1_new", title: "Track 1 New" },
      },
    };

    rerender({ playerStates: newPlayerStates });

    // Should log user action detection
    expect(console.log).toHaveBeenCalledWith(
      "🎯 User action detected: Track change",
      expect.objectContaining({
        deckA: { from: "track1", to: "track1_new" },
        deckB: { from: "track2", to: "track2" },
      })
    );

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should trigger crossfade since user action occurred and track has 5 seconds remaining
    expect(mockStartCrossfade).toHaveBeenCalledWith("A", "B", 2000);
  });

  it("should trigger crossfade only after user action (deploy)", () => {
    const { result, rerender } = renderHook(
      ({ playerStates }) =>
        useSmartCrossfade({
          playerStates,
          startCrossfade: mockStartCrossfade,
          isCrossfadeActive: mockIsCrossfadeActive,
        }),
      {
        initialProps: { playerStates: mockPlayerStates },
      }
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Simulate user action by changing track on deck B (deploy)
    const newPlayerStates = {
      ...mockPlayerStates,
      B: {
        ...mockPlayerStates.B,
        currentTrack: { id: "track2_new", title: "Track 2 New" },
      },
    };

    rerender({ playerStates: newPlayerStates });

    // Should log user action detection
    expect(console.log).toHaveBeenCalledWith(
      "🎯 User action detected: Track change",
      expect.objectContaining({
        deckA: { from: "track1", to: "track1" },
        deckB: { from: "track2", to: "track2_new" },
      })
    );

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should trigger crossfade since user action occurred
    expect(mockStartCrossfade).toHaveBeenCalledWith("B", "A", 2000);
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

  it("should respect cooldown period between crossfades", () => {
    const { result, rerender } = renderHook(
      ({ playerStates }) =>
        useSmartCrossfade({
          playerStates,
          startCrossfade: mockStartCrossfade,
          isCrossfadeActive: mockIsCrossfadeActive,
        }),
      {
        initialProps: { playerStates: mockPlayerStates },
      }
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Simulate user action
    rerender({ playerStates: mockPlayerStates });

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
    expect(console.log).toHaveBeenCalledWith(
      "🚫 Auto-crossfade skipped: Cooldown active"
    );

    // Advance past cooldown period
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Should trigger another crossfade
    expect(mockStartCrossfade).toHaveBeenCalledTimes(2);
  });

  it("should not trigger crossfade when time remaining is outside threshold", () => {
    const playerStatesWithLongTimeRemaining = {
      ...mockPlayerStates,
      A: {
        ...mockPlayerStates.A,
        currentTime: 5000, // 25 seconds remaining (outside 8 second threshold)
      },
    };

    const { result, rerender } = renderHook(
      ({ playerStates }) =>
        useSmartCrossfade({
          playerStates,
          startCrossfade: mockStartCrossfade,
          isCrossfadeActive: mockIsCrossfadeActive,
        }),
      {
        initialProps: { playerStates: mockPlayerStates },
      }
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Simulate user action
    rerender({ playerStates: playerStatesWithLongTimeRemaining });

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

    const { result, rerender } = renderHook(
      ({ playerStates }) =>
        useSmartCrossfade({
          playerStates,
          startCrossfade: mockStartCrossfade,
          isCrossfadeActive: mockIsCrossfadeActive,
        }),
      {
        initialProps: { playerStates: mockPlayerStates },
      }
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // Simulate user action
    rerender({ playerStates: playerStatesWithShortTimeRemaining });

    // Advance time to trigger auto-crossfade check
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should not trigger crossfade since time remaining is below minimum
    expect(mockStartCrossfade).not.toHaveBeenCalled();
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

  it("should track previous track IDs correctly", () => {
    const { result, rerender } = renderHook(
      ({ playerStates }) =>
        useSmartCrossfade({
          playerStates,
          startCrossfade: mockStartCrossfade,
          isCrossfadeActive: mockIsCrossfadeActive,
        }),
      {
        initialProps: { playerStates: mockPlayerStates },
      }
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // No user action yet
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockStartCrossfade).not.toHaveBeenCalled();

    // Simulate track change on deck A
    const newPlayerStates = {
      ...mockPlayerStates,
      A: {
        ...mockPlayerStates.A,
        currentTrack: { id: "track1_new", title: "Track 1 New" },
      },
    };

    rerender({ playerStates: newPlayerStates });

    // Should log user action detection with correct previous track IDs
    expect(console.log).toHaveBeenCalledWith(
      "🎯 User action detected: Track change",
      expect.objectContaining({
        deckA: { from: "track1", to: "track1_new" },
        deckB: { from: "track2", to: "track2" },
      })
    );

    // Now should trigger crossfade
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockStartCrossfade).toHaveBeenCalledWith("A", "B", 2000);
  });

  it("should provide comprehensive console logging for debugging", () => {
    const { result, rerender } = renderHook(
      ({ playerStates }) =>
        useSmartCrossfade({
          playerStates,
          startCrossfade: mockStartCrossfade,
          isCrossfadeActive: mockIsCrossfadeActive,
        }),
      {
        initialProps: { playerStates: mockPlayerStates },
      }
    );

    // Enable crossfade
    act(() => {
      result.current.toggleCrossfade();
    });

    // No user action - should log skip
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(console.log).toHaveBeenCalledWith(
      "🚫 Auto-crossfade skipped: No user action detected"
    );

    // Simulate user action
    rerender({ playerStates: mockPlayerStates });

    // Should log user action detection
    expect(console.log).toHaveBeenCalledWith(
      "🎯 User action detected: Track change",
      expect.any(Object)
    );

    // Should trigger crossfade
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockStartCrossfade).toHaveBeenCalled();
  });
});
