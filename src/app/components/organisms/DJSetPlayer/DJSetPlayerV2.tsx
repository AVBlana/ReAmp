"use client";

import { useRef, useEffect } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import { useUnifiedPlayer } from "@/app/hooks/useUnifiedPlayer";
import { useSmartCrossfade } from "@/app/hooks/useSmartCrossfade";
import VinylPlayer from "./VinylPlayer";
import CrossfadeControlsV2 from "@/app/components/molecules/CrossfadeControls/CrossfadeControlsV2";
import DeckLabel from "@/app/components/molecules/DeckLabel";

interface DJSetPlayerV2Props {
  className?: string;
}

export default function DJSetPlayerV2({ className = "" }: DJSetPlayerV2Props) {
  const { youtube, spotify, unified } = useUnifiedContext();
  const playerAContainerRef = useRef<HTMLDivElement>(null);
  const playerBContainerRef = useRef<HTMLDivElement>(null);

  // Use the unified player system
  const {
    isInitialized,
    playerStates,
    loadTrack,
    playDeck,
    pauseDeck,
    stopDeck,
    setDeckVolume,
    seekDeck,
    startCrossfade,
    isCrossfadeActive,
    getDeckState,
    isDeckReady,
    isDeckPlaying,
    hasTrack,
  } = useUnifiedPlayer({
    onPlayerStateChange: () => {
      // State change callback - no logging to reduce console spam
    },
    onCrossfadeStateChange: () => {
      // Crossfade state change callback - no logging to reduce console spam
    },
  });

  // Use the smart crossfade system
  const {
    crossfadeEnabled,
    crossfadeDuration,
    autoCrossfadeThreshold,
    minTimeRemaining,
    toggleCrossfade,
    triggerManualCrossfade,
    setCrossfadeDurationMs,
    setAutoCrossfadeThresholdMs,
    setMinTimeRemainingMs,
    canCrossfade,
    getCrossfadeSuggestions,
  } = useSmartCrossfade({
    playerStates,
    startCrossfade,
    isCrossfadeActive,
  });

  // Monitor playlist changes and clear video containers when tracks are removed
  useEffect(() => {
    // Get current tracks in decks
    const deckAState = getDeckState("A");
    const deckBState = getDeckState("B");
    const deckATrack = deckAState.currentTrack;
    const deckBTrack = deckBState.currentTrack;

    // Check if any deck tracks are no longer in the playlist
    if (deckATrack && deckAState.service === ServiceType.Youtube) {
      const isInPlaylist = unified.playlist.some((item) => {
        if (item.type === ServiceType.Youtube) {
          const youtubeItem = item.data as YoutubeVideo;
          return (
            youtubeItem.id.videoId === (deckATrack as YoutubeVideo).id.videoId
          );
        }
        return false;
      });

      if (!isInPlaylist) {
        console.log(
          "🧹 YouTube track removed from playlist, clearing deck A video container"
        );
        clearVideoContainer("A");
      }
    }

    if (deckBTrack && deckBState.service === ServiceType.Youtube) {
      const isInPlaylist = unified.playlist.some((item) => {
        if (item.type === ServiceType.Youtube) {
          const youtubeItem = item.data as YoutubeVideo;
          return (
            youtubeItem.id.videoId === (deckBTrack as YoutubeVideo).id.videoId
          );
        }
        return false;
      });

      if (!isInPlaylist) {
        console.log(
          "🧹 YouTube track removed from playlist, clearing deck B video container"
        );
        clearVideoContainer("B");
      }
    }
  }, [unified.playlist, getDeckState]);

  // Monitor deck state changes to clear video containers when YouTube tracks stop playing
  useEffect(() => {
    const deckAState = getDeckState("A");
    const deckBState = getDeckState("B");

    // Clear video container if YouTube track stops playing
    if (
      deckAState.service === ServiceType.Youtube &&
      !deckAState.isPlaying &&
      hasTrack("A")
    ) {
      clearVideoContainer("A");
    }

    if (
      deckBState.service === ServiceType.Youtube &&
      !deckBState.isPlaying &&
      hasTrack("B")
    ) {
      clearVideoContainer("B");
    }
  }, [getDeckState, hasTrack]);

  // Helper function to clear video container for a specific deck
  const clearVideoContainer = (deckId: "A" | "B") => {
    const container =
      deckId === "A"
        ? playerAContainerRef.current
        : playerBContainerRef.current;
    if (container) {
      const iframes = container.querySelectorAll('iframe[src*="youtube"]');
      if (iframes.length > 0) {
        console.log(`🧹 Clearing video container for deck ${deckId}`);
        iframes.forEach((iframe) => iframe.remove());
      }
    }
  };

  // Get the currently playing YouTube videos for display
  const getCurrentYouTubeVideos = () => {
    const videos: { playerId: "A" | "B"; video: YoutubeVideo }[] = [];

    if (hasTrack("A") && getDeckState("A").service === ServiceType.Youtube) {
      const track = getDeckState("A").currentTrack as YoutubeVideo;
      videos.push({ playerId: "A", video: track });
    }
    if (hasTrack("B") && getDeckState("B").service === ServiceType.Youtube) {
      const track = getDeckState("B").currentTrack as YoutubeVideo;
      videos.push({ playerId: "B", video: track });
    }

    return videos;
  };

  // Handle drops from search results
  useEffect(() => {
    const handleDJPlayerDrop = async (event: CustomEvent) => {
      const { playerId, draggableId, service, id } = event.detail;

      console.log("📥 DJ Player Drop Event:", {
        playerId,
        draggableId,
        service,
        id,
      });

      if (playerId && draggableId && service && id) {
        // Check if crossfade is in progress
        if (isCrossfadeActive()) {
          console.log("🚫 Cannot drop song - crossfade in progress");
          alert(
            "Please wait for the current crossfade to complete before dropping a new song."
          );
          return;
        }

        // Find the actual song/video object
        let song: Song | YoutubeVideo | null = null;

        if (service === ServiceType.Youtube) {
          song =
            youtube.searchResults.find((v) => v.id.videoId === id) ||
            (unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Youtube
            )?.data as YoutubeVideo);
        } else if (service === ServiceType.Spotify) {
          song =
            spotify.searchResults.find((s) => s.id === id) ||
            (unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Spotify
            )?.data as Song);
        }

        if (song) {
          try {
            // Load the track into the deck
            await loadTrack(playerId as "A" | "B", song);
            // Track loading success is already logged in UnifiedPlayerManager
          } catch (error) {
            console.error(
              `❌ Failed to load track into deck ${playerId}:`,
              error
            );

            // Provide user-friendly error messages for common issues
            let userMessage = "Failed to load track";
            if (error instanceof Error) {
              if (error.message.includes("device not available")) {
                userMessage =
                  "Spotify device not available. Please ensure Spotify app is open and active.";
              } else if (error.message.includes("authentication")) {
                userMessage =
                  "Spotify authentication failed. Please log in again.";
              } else {
                userMessage = error.message;
              }
            }

            alert(userMessage);
          }
        } else {
          console.error(`❌ Could not find ${service} item with id: ${id}`);
          alert(`Could not find ${service} item. Please try searching again.`);
        }
      }
    };

    window.addEventListener(
      "dj-player-drop",
      handleDJPlayerDrop as unknown as EventListener
    );

    return () => {
      window.removeEventListener(
        "dj-player-drop",
        handleDJPlayerDrop as unknown as EventListener
      );
    };
  }, [
    youtube.searchResults,
    spotify.searchResults,
    unified.playlist,
    loadTrack,
    isCrossfadeActive,
  ]);

  // Render player drop zone
  const renderPlayerDropZone = (playerId: "A" | "B") => {
    const playerState = getDeckState(playerId);
    const isReady = isDeckReady(playerId);
    const hasTrackLoaded = hasTrack(playerId);

    return (
      <Droppable droppableId={`dj-player-${playerId}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`w-full h-full rounded-lg border-2 border-dashed transition-all duration-200 ${
              isCrossfadeActive()
                ? "border-yellow-400 bg-yellow-400/10 cursor-not-allowed"
                : snapshot.isDraggingOver
                ? "border-red-400 bg-red-400/10 scale-[1.02] shadow-lg"
                : "border-gray-600 bg-black/20 hover:border-gray-500 hover:bg-black/30 hover:scale-[1.01] hover:shadow-md"
            }`}
            onDrop={(e) => {
              e.preventDefault();
              console.log(`📥 Drop event triggered for ${playerId}`);

              if (isCrossfadeActive()) {
                console.log(
                  `🚫 Cannot drop song on ${playerId} - crossfade in progress`
                );
                alert(
                  "Please wait for the current crossfade to complete before dropping a new song."
                );
                return;
              }

              const songData = e.dataTransfer.getData("application/json");
              if (songData) {
                try {
                  const { song, service } = JSON.parse(songData);
                  console.log(`🎵 Parsed song data for ${playerId}:`, {
                    service,
                    songTitle:
                      service === ServiceType.Youtube
                        ? (song as YoutubeVideo).snippet.title
                        : (song as Song).title,
                  });
                  // Implementation will be added here
                } catch (error) {
                  console.error("Error parsing dropped song:", error);
                }
              } else {
                console.error(
                  `❌ No song data found in drop event for ${playerId}`
                );
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            {hasTrackLoaded && isReady ? (
              <VinylPlayer
                playerId={playerId}
                playerState={{
                  service: playerState.service,
                  song: playerState.currentTrack,
                  isPlaying: playerState.isPlaying,
                  volume: playerState.volume,
                  isMuted: playerState.isMuted,
                  crossfade: 0, // Not used in new system
                  currentTime: playerState.currentTime,
                  duration: playerState.duration,
                  isActive: playerState.isReady,
                  playerId: playerId,
                }}
                onPlay={() => playDeck(playerId)}
                onPause={() => pauseDeck(playerId)}
                onStop={() => stopDeck(playerId)}
                onVolumeChange={(volume) => setDeckVolume(playerId, volume)}
                onSeek={(position) => seekDeck(playerId, position)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 p-4">
                <div className="text-center">
                  <DeckLabel deckId={playerId} variant="minimal" size="lg" />
                  {isCrossfadeActive() ? (
                    <div className="text-sm text-yellow-400 mt-2">
                      Crossfade in progress...
                    </div>
                  ) : (
                    <div className="text-sm mt-2">
                      <div className="mb-2">Drop a track here</div>
                      <div className="text-xs opacity-75">or tap to select</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  if (!isInitialized) {
    return (
      <div className="w-full h-full bg-black/20 rounded-lg p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg font-mono mb-2">
            Initializing DJ Player...
          </div>
          <div className="text-gray-400 text-sm">
            Please wait while the system loads
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full min-h-full bg-black/20 rounded-lg p-3 sm:p-6 flex flex-col ${className}`}
    >
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 flex-shrink-0 space-y-3 sm:space-y-0">
        <h2 className="text-lg sm:text-2xl font-bold text-white font-mono text-center sm:text-left">
          Welcome DJ, drop a track!
        </h2>
        {/* Mobile scroll hint */}
        <div className="block sm:hidden text-xs text-gray-400 text-center animate-pulse">
          ↓ Scroll down to see decks ↓
        </div>
        <div className="flex justify-center sm:justify-end">
          <CrossfadeControlsV2
            crossfadeEnabled={crossfadeEnabled}
            crossfadeDuration={crossfadeDuration}
            autoCrossfadeThreshold={autoCrossfadeThreshold}
            minTimeRemaining={minTimeRemaining}
            isCrossfadeActive={isCrossfadeActive()}
            canCrossfade={canCrossfade()}
            crossfadeSuggestions={getCrossfadeSuggestions()}
            onToggleCrossfade={toggleCrossfade}
            onManualCrossfade={triggerManualCrossfade}
            onSetCrossfadeDuration={setCrossfadeDurationMs}
            onSetAutoCrossfadeThreshold={setAutoCrossfadeThresholdMs}
            onSetMinTimeRemaining={setMinTimeRemainingMs}
          />
        </div>
      </div>

      {/* YouTube Video Display - Mobile Responsive */}
      <div className="mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 w-full">
          {(["A", "B"] as const).map((playerId) => {
            const currentVideo = getCurrentYouTubeVideos().find(
              (v) => v.playerId === playerId
            );
            const isPlaying = isDeckPlaying(playerId);
            const hasYouTubeTrack =
              hasTrack(playerId) &&
              getDeckState(playerId).service === ServiceType.Youtube;

            // Always render the container for the player manager, but conditionally show content
            const shouldShowVideo = hasYouTubeTrack && isPlaying;

            // Check if only one video is playing to make it bigger
            const playingVideos = getCurrentYouTubeVideos().filter((v) =>
              isDeckPlaying(v.playerId)
            );
            const isOnlyVideoPlaying =
              playingVideos.length === 1 && shouldShowVideo;

            return (
              <div
                key={playerId}
                className={`flex justify-center ${
                  isOnlyVideoPlaying ? "flex-1" : ""
                }`}
              >
                <div
                  className={`relative bg-black rounded-lg overflow-hidden shadow-2xl transition-all duration-500 ease-in-out ${
                    shouldShowVideo
                      ? isOnlyVideoPlaying
                        ? "w-full h-48 sm:h-80 aspect-video opacity-100"
                        : "w-full h-32 sm:h-64 aspect-video opacity-100"
                      : "w-12 h-12 sm:w-16 sm:h-16 opacity-60"
                  }`}
                >
                  {/* YouTube API Player Container - Always present for player manager */}
                  <div
                    id={`youtube-player-${playerId}`}
                    className="w-full h-full"
                    ref={
                      playerId === "A"
                        ? playerAContainerRef
                        : playerBContainerRef
                    }
                  />

                  {/* Deck label */}
                  <div className="absolute top-1 left-1 z-30">
                    <div className="bg-black/90 text-white text-xs font-mono px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                      DECK {playerId}
                    </div>
                  </div>

                  {/* Video info */}
                  {currentVideo ? null : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main DJ Interface - Mobile Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-6 lg:gap-8 flex-1 min-h-0 mb-6">
        {/* Player A */}
        <div className="bg-black/30 rounded-lg p-3 sm:p-6 pb-6 sm:pb-8 border border-gray-700 flex flex-col min-h-0 shadow-lg">
          <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
            <DeckLabel deckId="A" variant="watermelon" size="lg" />
          </div>
          <div className="flex-1 min-h-[250px] sm:min-h-[300px] mb-4">
            {renderPlayerDropZone("A")}
          </div>
        </div>

        {/* Player B */}
        <div className="bg-black/30 rounded-lg p-3 sm:p-6 pb-6 sm:pb-8 border border-gray-700 flex flex-col min-h-0 shadow-lg">
          <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
            <DeckLabel deckId="B" variant="watermelon" size="lg" />
          </div>
          <div className="flex-1 min-h-[250px] sm:min-h-[300px] mb-4">
            {renderPlayerDropZone("B")}
          </div>
        </div>
      </div>

      {/* Debug Info (can be removed in production)
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-black/50 rounded text-xs font-mono text-gray-400">
          <div>
            Deck A: {hasTrack("A") ? "Loaded" : "Empty"} |{" "}
            {isDeckReady("A") ? "Ready" : "Not Ready"} |{" "}
            {isDeckPlaying("A") ? "Playing" : "Stopped"}
          </div>
          <div>
            Deck B: {hasTrack("B") ? "Loaded" : "Empty"} |{" "}
            {isDeckReady("B") ? "Ready" : "Not Ready"} |{" "}
            {isDeckPlaying("B") ? "Playing" : "Stopped"}
          </div>
          <div>
            Crossfade: {crossfadeEnabled ? "Enabled" : "Disabled"} |{" "}
            {isCrossfadeActive() ? "Active" : "Inactive"}
          </div>
        </div>
      )} */}
    </div>
  );
}
