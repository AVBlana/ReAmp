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
    crossfadeState,
    loadTrack,
    playDeck,
    pauseDeck,
    stopDeck,
    setDeckVolume,
    seekDeck,
    startCrossfade,
    clearDeck,
    isCrossfadeActive,
    getDeckState,
    isDeckReady,
    isDeckPlaying,
    hasTrack,
  } = useUnifiedPlayer({
    onPlayerStateChange: (deckId, state) => {
      // State change callback - no logging to reduce console spam
    },
    onCrossfadeStateChange: (state) => {
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
            alert(
              `Failed to load track: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
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
    const isPlaying = isDeckPlaying(playerId);
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
                ? "border-red-400 bg-red-400/10"
                : "border-gray-600 bg-black/20"
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
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <DeckLabel deckId={playerId} variant="minimal" size="lg" />
                  {isCrossfadeActive() ? (
                    <div className="text-sm text-yellow-400">
                      Crossfade in progress...
                    </div>
                  ) : (
                    <div className="text-sm">Drop a track here</div>
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
      className={`w-full h-full bg-black/20 rounded-lg p-6 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white font-mono">
          DJ SET PLAYER V2
        </h2>
        <div className="flex items-center gap-4">
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

      {/* YouTube Video Display */}
      <div className="mb-4 flex-shrink-0">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {["A", "B"].map((playerId) => {
            const currentVideo = getCurrentYouTubeVideos().find(
              (v) => v.playerId === playerId
            );

            return (
              <div key={playerId} className="flex justify-center">
                <div className="relative w-full max-w-xl max-h-48 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                  {/* YouTube API Player Container */}
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
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    DECK {playerId}
                  </div>

                  {/* Video info */}
                  {currentVideo ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <h3 className="text-white font-semibold text-xs truncate">
                        {currentVideo.video.snippet.title}
                      </h3>
                      <p className="text-gray-300 text-xs truncate">
                        {currentVideo.video.snippet.channelTitle}
                      </p>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="text-sm font-mono">NO VIDEO</div>
                        <div className="text-xs">Drop a YouTube track here</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main DJ Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
        {/* Player A */}
        <div className="bg-black/30 rounded-lg p-6 border border-gray-700 flex flex-col min-h-0">
          <div className="text-center mb-4 flex-shrink-0">
            <DeckLabel deckId="A" variant="watermelon" size="lg" />
          </div>
          <div className="flex-1 min-h-0">{renderPlayerDropZone("A")}</div>
        </div>

        {/* Player B */}
        <div className="bg-black/30 rounded-lg p-6 border border-gray-700 flex flex-col min-h-0">
          <div className="text-center mb-4 flex-shrink-0">
            <DeckLabel deckId="B" variant="watermelon" size="lg" />
          </div>
          <div className="flex-1 min-h-0">{renderPlayerDropZone("B")}</div>
        </div>
      </div>

      {/* Debug Info (can be removed in production) */}
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
      )}
    </div>
  );
}
