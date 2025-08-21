"use client";

import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { Droppable } from "@hello-pangea/dnd";
import { useEffect, useRef, useState } from "react";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import VinylPlayer from "./VinylPlayer";
import CrossfadeControls from "@/app/components/molecules/CrossfadeControls";
import DeckLabel from "@/app/components/molecules/DeckLabel";
import { usePlayerControls } from "@/app/hooks/usePlayerControls";
import { useCrossfade } from "@/app/hooks/useCrossfade";
import { SpotifyPlayerManager } from "@/app/managers/SpotifyPlayerManager";
import { YouTubePlayerManager } from "@/app/managers/YouTubePlayerManager";

interface DJPlayerState {
  service: ServiceType | null;
  song: Song | YoutubeVideo | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  crossfade: number;
  currentTime: number;
  duration: number;
  isActive: boolean;
  playerId: string;
}

interface DJSetPlayerProps {
  className?: string;
}

// Add minimal YT and Spotify type definitions if not present
// These should be replaced by proper types if available in the project

export type YTPlayerState = 0 | 1 | 2 | 3 | 5;
export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => YTPlayerState;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setVolume?: (volume: number) => Promise<void>;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  addListener: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener: (event: string, cb: (...args: unknown[]) => void) => void;
  _options?: { device_id?: string };
}

export interface SpotifyPlaybackState {
  position: number;
  duration: number;
  paused: boolean;
}

// Use imported managers instead of inline classes
const youtubeManager = new YouTubePlayerManager();
const spotifyManager = new SpotifyPlayerManager();

export default function DJSetPlayer({ className = "" }: DJSetPlayerProps) {
  const { youtube, spotify, unified } = useUnifiedContext();
  const [players, setPlayers] = useState<{
    A: DJPlayerState;
    B: DJPlayerState;
  }>({
    A: {
      service: null,
      song: null,
      isPlaying: false,
      volume: 50,
      isMuted: false,
      crossfade: 0,
      currentTime: 0,
      duration: 0,
      isActive: false,
      playerId: "A",
    },
    B: {
      service: null,
      song: null,
      isPlaying: false,
      volume: 50,
      isMuted: false,
      crossfade: 0,
      currentTime: 0,
      duration: 0,
      isActive: false,
      playerId: "B",
    },
  });

  const playerAContainerRef = useRef<HTMLDivElement>(null);
  const playerBContainerRef = useRef<HTMLDivElement>(null);

  // Get the currently playing YouTube videos
  const getCurrentYouTubeVideos = () => {
    const videos: { playerId: "A" | "B"; video: YoutubeVideo }[] = [];

    if (
      players.A.isActive &&
      players.A.service === ServiceType.Youtube &&
      players.A.song
    ) {
      videos.push({ playerId: "A", video: players.A.song as YoutubeVideo });
    }
    if (
      players.B.isActive &&
      players.B.service === ServiceType.Youtube &&
      players.B.song
    ) {
      videos.push({ playerId: "B", video: players.B.song as YoutubeVideo });
    }

    return videos;
  };

  // Use the imported hooks
  const playerControls = usePlayerControls({
    players,
    setPlayers,
    youtubeManager,
    spotifyManager,
  });
  const { initializePlayer } = playerControls;

  const crossfadeControls = useCrossfade({
    players,
    setPlayers,
    youtubeManager,
    handlePlay: playerControls.handlePlay,
    handlePause: playerControls.handlePause,
    handleVolumeChange: playerControls.handleVolumeChange,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      youtubeManager.destroyAll();
      spotifyManager.destroyAll();
    };
  }, []);

  // Real-time progress updates for active players
  useEffect(() => {
    const updateProgress = async () => {
      // Refresh Spotify state from SDK (throttled via our interval)
      await Promise.all(
        (["A", "B"] as const).map((id) =>
          spotifyManager.updatePlayerState(id).catch(() => {})
        )
      );

      setPlayers((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        // Update YouTube players
        ["A", "B"].forEach((playerId) => {
          const player = prev[playerId as "A" | "B"];
          if (player.isActive && player.service === ServiceType.Youtube) {
            try {
              const currentTime =
                youtubeManager.getCurrentTime(playerId) * 1000; // ms
              const duration = youtubeManager.getDuration(playerId) * 1000; // ms
              const isPlaying = youtubeManager.getPlayerState(playerId) === 1; // 1 = playing

              if (
                currentTime !== player.currentTime ||
                duration !== player.duration ||
                isPlaying !== player.isPlaying
              ) {
                updated[playerId as "A" | "B"] = {
                  ...player,
                  currentTime,
                  duration,
                  isPlaying,
                };
                hasChanges = true;
              }
            } catch (error) {
              console.warn(
                `Error updating YouTube progress for ${playerId}:`,
                error
              );
            }
          }
        });

        // Update Spotify players (read from manager cache which is updated by SDK events / refresh above)
        ["A", "B"].forEach((playerId) => {
          const player = prev[playerId as "A" | "B"];
          if (player.isActive && player.service === ServiceType.Spotify) {
            try {
              const currentTime = spotifyManager.getCurrentTime(playerId); // already ms
              const duration = spotifyManager.getDuration(playerId); // already ms
              const isPlaying = spotifyManager.getPlayerState(playerId) === 1;

              if (
                currentTime !== player.currentTime ||
                duration !== player.duration ||
                isPlaying !== player.isPlaying
              ) {
                updated[playerId as "A" | "B"] = {
                  ...player,
                  currentTime,
                  duration,
                  isPlaying,
                };
                hasChanges = true;
              }
            } catch (error) {
              console.warn(
                `Error updating Spotify progress for ${playerId}:`,
                error
              );
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    };

    const interval = setInterval(() => {
      void updateProgress();
    }, 250); // ~4 fps to reduce CPU
    return () => clearInterval(interval);
  }, []);

  // Handle drops from search results
  useEffect(() => {
    const handleDJPlayerDrop = async (event: CustomEvent) => {
      const { playerId, draggableId, service, id } = event.detail;

      console.log("📥 DJ Player Drop Event:", {
        playerId,
        draggableId,
        service,
        id,
        eventDetail: event.detail,
      });

      // Enhanced debugging for the received data
      console.log("🔍 Received drop data:", {
        playerId,
        draggableId,
        service,
        id,
        idType: typeof id,
        idLength: id ? id.length : "undefined",
        serviceType: typeof service,
      });

      if (playerId && draggableId && service && id) {
        // Find the actual song/video object based on the service and id
        let song: Song | YoutubeVideo | null = null;

        if (service === ServiceType.Youtube) {
          // Look in search results first, then in playlist
          console.log("🔍 Searching for YouTube item:", {
            searchId: id,
            searchResultsCount: youtube.searchResults.length,
            playlistCount: unified.playlist.length,
          });

          song =
            youtube.searchResults.find((v) => v.id.videoId === id) ||
            (unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Youtube
            )?.data as YoutubeVideo);

          console.log("🔍 YouTube search result:", {
            foundInSearchResults: !!youtube.searchResults.find(
              (v) => v.id.videoId === id
            ),
            foundInPlaylist: !!unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Youtube
            ),
            song: song ? "Found" : "Not found",
          });
        } else if (service === ServiceType.Spotify) {
          // Look in search results first, then in playlist
          console.log("🔍 Searching for Spotify item:", {
            searchId: id,
            searchResultsCount: spotify.searchResults.length,
            playlistCount: unified.playlist.length,
          });

          song =
            spotify.searchResults.find((s) => s.id === id) ||
            (unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Spotify
            )?.data as Song);

          console.log("🔍 Spotify search result:", {
            foundInSearchResults: !!spotify.searchResults.find(
              (s) => s.id === id
            ),
            foundInPlaylist: !!unified.playlist.find(
              (item) => item.id === id && item.type === ServiceType.Spotify
            ),
            song: song ? "Found" : "Not found",
          });
        }

        if (song) {
          console.log(`Initializing ${playerId} player with:`, {
            song,
            service,
          });

          // Check if crossfade is in progress before allowing song drop
          if (crossfadeControls.isCrossfadeInProgress()) {
            console.log(
              `🚫 Cannot drop song on ${playerId} - crossfade in progress`
            );

            // Additional check: Verify if the crossfade state is actually valid
            const crossfadeCheck = crossfadeControls.safeSongDrop(playerId);
            if (!crossfadeCheck.success) {
              alert(crossfadeCheck.message);
              return;
            }

            alert(
              "Please wait for the current crossfade to complete before dropping a new song."
            );
            return;
          }

          // Initialize the player for the dropped song
          if (playerId === "A" || playerId === "B") {
            const deck = playerId as "A" | "B";

            // Check if there's already a song playing on this deck
            const currentPlayer = players[deck];
            const hasExistingSong =
              currentPlayer.isActive && currentPlayer.song;

            if (hasExistingSong) {
              console.log(`🔄 Replacing existing song on ${deck}:`, {
                oldSong: currentPlayer.song,
                newSong: song,
                wasPlaying: currentPlayer.isPlaying,
              });

              // Stop the current song first
              try {
                if (currentPlayer.isPlaying) {
                  console.log(`⏹️ Stopping current song on ${deck}`);
                  await playerControls.handleStop(deck);
                }

                // Additional cleanup for YouTube players
                if (currentPlayer.service === ServiceType.Youtube) {
                  console.log(`🧹 Cleaning up YouTube player on ${deck}`);
                  // Try to pause and reset the YouTube player
                  try {
                    await playerControls.handlePause(deck);
                  } catch (error) {
                    console.log(
                      `⚠️ Error pausing YouTube player on ${deck}:`,
                      error
                    );
                  }
                }
              } catch (error) {
                console.log(
                  `⚠️ Error stopping current song on ${deck}:`,
                  error
                );
              }

              // Clear the current player state
              setPlayers((prev) => ({
                ...prev,
                [deck]: {
                  ...prev[deck],
                  isActive: false,
                  isPlaying: false,
                  song: null,
                  service: null,
                  currentTime: 0,
                  duration: 0,
                  volume: prev[deck].volume, // Keep volume setting
                },
              }));

              // Reset crossfade state for this deck to ensure clean transitions
              if (crossfadeControls.crossfadeInProgress) {
                console.log(
                  `🔄 Resetting crossfade state for ${deck} due to song replacement`
                );
                // Use the crossfade hook's reset function for proper cleanup
                crossfadeControls.resetCrossfadeForDeck(deck);
              }

              // Small delay to ensure cleanup is complete
              await new Promise((resolve) => setTimeout(resolve, 100));
            }

            // Update the state with the new song
            setPlayers((prev) => ({
              ...prev,
              [deck]: {
                ...prev[deck],
                service,
                song,
                isActive: true,
                isPlaying: false, // Start paused, let user decide when to play
                currentTime: 0,
                duration: 0,
              },
            }));

            // Then initialize the player
            console.log(
              `🎯 Calling initializePlayer for ${deck} with ${service} song`
            );
            try {
              await initializePlayer(deck, song, service);
              console.log(`✅ Player ${deck} initialized successfully`);
            } catch (error) {
              console.error(`❌ Failed to initialize player ${deck}:`, error);
            }
          }
        } else {
          // Enhanced error logging to debug the issue
          console.error(`❌ Could not find ${service} item with id: ${id}`);
          console.error("🔍 Debug information:", {
            draggedId: id,
            draggedService: service,
            youtubeSearchResultsCount: youtube.searchResults.length,
            spotifySearchResultsCount: spotify.searchResults.length,
            unifiedPlaylistCount: unified.playlist.length,
            youtubeSearchResultIds: youtube.searchResults.map(
              (item) => item.id.videoId || item.id
            ),
            spotifySearchResultIds: spotify.searchResults.map(
              (item) => item.id
            ),
            unifiedPlaylistIds: unified.playlist.map((item) => item.id),
          });

          // Try to find partial matches
          const partialMatches = {
            youtube: youtube.searchResults.filter((item) => {
              if (
                item.id &&
                typeof item.id === "object" &&
                "videoId" in item.id
              ) {
                return item.id.videoId && item.id.videoId.includes(id);
              }
              return false;
            }),
            spotify: spotify.searchResults.filter(
              (item) => typeof item.id === "string" && item.id.includes(id)
            ),
            unified: unified.playlist.filter(
              (item) => typeof item.id === "string" && item.id.includes(id)
            ),
          };

          if (
            partialMatches.youtube.length > 0 ||
            partialMatches.spotify.length > 0 ||
            partialMatches.unified.length > 0
          ) {
            console.log("🔍 Partial matches found:", partialMatches);
          }

          alert(
            `Could not find ${service} item with ID "${id}". Please try searching again or check if the item is still available.`
          );
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
    initializePlayer,
    crossfadeControls.isCrossfadeInProgress,
  ]);

  const renderPlayerDropZone = (
    playerId: "A" | "B",
    playerState: DJPlayerState
  ) => {
    return (
      <Droppable droppableId={`dj-player-${playerId}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`w-full h-full rounded-lg border-2 border-dashed transition-all duration-200 ${
              crossfadeControls.isCrossfadeInProgress()
                ? "border-yellow-400 bg-yellow-400/10 cursor-not-allowed"
                : snapshot.isDraggingOver
                ? "border-red-400 bg-red-400/10"
                : "border-gray-600 bg-black/20"
            }`}
            onDrop={(e) => {
              e.preventDefault();
              console.log(`📥 Drop event triggered for ${playerId}`);

              // Check if crossfade is in progress before allowing song drop
              if (crossfadeControls.isCrossfadeInProgress()) {
                console.log(
                  `🚫 Cannot drop song on ${playerId} - crossfade in progress`
                );

                // Additional check: Verify if the crossfade state is actually valid
                const crossfadeCheck = crossfadeControls.safeSongDrop(playerId);
                if (!crossfadeCheck.success) {
                  alert(crossfadeCheck.message);
                  return;
                }

                alert(
                  "Please wait for the current crossfade to complete before dropping a new song."
                );
                return;
              }

              const songData = e.dataTransfer.getData("application/json");
              console.log(`📦 Song data received:`, songData ? "Yes" : "No");
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
            {playerState.isActive ? (
              <VinylPlayer
                playerId={playerId}
                playerState={playerState}
                onPlay={() => playerControls.handlePlay(playerId)}
                onPause={() => playerControls.handlePause(playerId)}
                onStop={() => playerControls.handleStop(playerId)}
                onVolumeChange={(volume) =>
                  playerControls.handleVolumeChange(playerId, volume)
                }
                onSeek={(position) =>
                  playerControls.handleSeek(playerId, position)
                }
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <DeckLabel deckId={playerId} variant="minimal" size="lg" />
                  {crossfadeControls.isCrossfadeInProgress() ? (
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

  return (
    <div
      className={`w-full h-full bg-black/20 rounded-lg p-6 flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white font-mono">
          DJ SET PLAYER
        </h2>
        <div className="flex items-center gap-4">
          <CrossfadeControls
            crossfade={crossfadeControls.crossfade}
            onCrossfadeChange={crossfadeControls.setCrossfade}
            isEnabled={crossfadeControls.isCrossfadeEnabled}
            onToggle={crossfadeControls.toggleCrossfade}
            onManualCrossfade={crossfadeControls.handleCrossfade}
            isActive={crossfadeControls.crossfadeInProgress}
          />
        </div>
      </div>

      {/* YouTube Video Display - Using API Players */}
      <div className="mb-4 flex-shrink-0">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* Always render containers for both decks */}
          {["A", "B"].map((playerId) => {
            const currentVideo = getCurrentYouTubeVideos().find(
              (v) => v.playerId === playerId
            );

            return (
              <div key={playerId} className="flex justify-center">
                <div className="relative w-full max-w-xl max-h-48 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                  {/* YouTube API Player Container - Always rendered */}
                  <div
                    id={`youtube-player-${playerId}`}
                    className="w-full h-full"
                    ref={
                      playerId === "A"
                        ? playerAContainerRef
                        : playerBContainerRef
                    }
                  />

                  {/* Deck label - Always visible */}
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    DECK {playerId}
                  </div>

                  {/* Video info - Only shown when video exists */}
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
          <div className="flex-1 min-h-0">
            {renderPlayerDropZone("A", players.A)}
          </div>
        </div>

        {/* Player B */}
        <div className="bg-black/30 rounded-lg p-6 border border-gray-700 flex flex-col min-h-0">
          <div className="text-center mb-4 flex-shrink-0">
            <DeckLabel deckId="B" variant="watermelon" size="lg" />
          </div>
          <div className="flex-1 min-h-0">
            {renderPlayerDropZone("B", players.B)}
          </div>
        </div>
      </div>
    </div>
  );
}
