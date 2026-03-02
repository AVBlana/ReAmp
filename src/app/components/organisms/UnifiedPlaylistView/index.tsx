"use client";

import React, {
  useMemo,
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Droppable,
  Draggable,
  DroppableProvided,
  DroppableStateSnapshot,
  DraggableProvided,
  DraggableStateSnapshot,
} from "@hello-pangea/dnd";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { ServiceType } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import { Song } from "@/app/types/playerTypes";
import PlaylistItem from "@/app/components/molecules/PlaylistItem";

// Import atomic design components
import Input from "@/app/components/atoms/Input";
import ServiceIcon from "@/app/components/atoms/ServiceIcon";
import Button from "@/app/components/atoms/Button";

interface UnifiedPlaylistItem {
  id: string;
  type: ServiceType;
  data: YoutubeVideo | Song;
}

interface DraggableItemProps {
  item: UnifiedPlaylistItem;
  index: number;
}

// Memoized item content component
const PlaylistItemContent = memo(
  ({
    item,
    style,
    isDragging,
    isCurrentlyPlaying,
  }: {
    item: UnifiedPlaylistItem;
    style: React.CSSProperties;
    isDragging: boolean;
    isCurrentlyPlaying: boolean;
  }) => {
    const { youtube, spotify, unified } = useUnifiedContext();

    const getTitle = (data: YoutubeVideo | Song, service: ServiceType) => {
      if (service === ServiceType.Youtube) {
        return (data as YoutubeVideo).snippet.title;
      } else {
        return (data as Song).title;
      }
    };

    const getArtist = (data: YoutubeVideo | Song, service: ServiceType) => {
      if (service === ServiceType.Youtube) {
        return (data as YoutubeVideo).snippet.channelTitle;
      } else {
        return (data as Song).artist?.name || "Unknown Artist";
      }
    };

    const getThumbnail = (data: YoutubeVideo | Song, service: ServiceType) => {
      if (service === ServiceType.Youtube) {
        return (data as YoutubeVideo).snippet.thumbnails.default.url;
      } else {
        return (
          (data as Song).artwork?.small?.url ||
          (data as Song).artwork?.medium?.url ||
          (data as Song).artwork?.big?.url ||
          ""
        );
      }
    };

    const handlePlay = () => {
      if (item.type === ServiceType.Youtube) {
        const video = item.data as YoutubeVideo;
        if (youtube.selectedVideo !== video.id.videoId) {
          youtube.setSelectedVideo(video.id.videoId);
          if (spotify.currentSong) {
            spotify.setCurrentSong(null);
          }
        }
      } else {
        const song = item.data as Song;
        if (spotify.currentSong?.id !== song.id) {
          spotify.setCurrentSong(song);
          if (youtube.selectedVideo) {
            youtube.setSelectedVideo(null);
          }
        }
      }
    };

    const handleRemove = () => {
      unified.removeFromPlaylist(item.id);
    };

    const onDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", `${item.type}|${item.id}`);
    };

    return (
      <div
        className={`${
          isDragging ? "bg-[#FF6B6B]/10" : "hover:bg-[#FF6B6B]/5"
        } transition-colors ${
          isCurrentlyPlaying
            ? "border-2 border-[#FF6B6B] shadow-[0_0_8px_rgba(255,107,107,0.6)]"
            : ""
        } rounded-lg`}
        style={style}
      >
        <PlaylistItem
          id={item.id}
          title={getTitle(item.data, item.type)}
          artist={getArtist(item.data, item.type)}
          thumbnail={getThumbnail(item.data, item.type)}
          service={item.type === ServiceType.Youtube ? "youtube" : "spotify"}
          isCurrent={isCurrentlyPlaying}
          onPlay={handlePlay}
          onRemove={handleRemove}
          draggable={true}
          onDragStart={onDragStart}
        />
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.type === next.item.type &&
      prev.style === next.style &&
      prev.isDragging === next.isDragging &&
      prev.isCurrentlyPlaying === next.isCurrentlyPlaying
    );
  }
);

PlaylistItemContent.displayName = "PlaylistItemContent";

// Memoized item component with stable props
const DraggableItem = memo(({ item, index }: DraggableItemProps) => {
  const { youtube, spotify } = useUnifiedContext();

  // Check if this item is currently playing
  const isCurrentlyPlaying = useMemo(() => {
    if (item.type === ServiceType.Youtube) {
      return youtube.selectedVideo === item.id;
    } else {
      return spotify.currentSong?.id === item.id;
    }
  }, [item, youtube.selectedVideo, spotify.currentSong]);

  return (
    <Draggable draggableId={`${item.type}|${item.id}`} index={index}>
      {(
        provided: DraggableProvided,
        { isDragging }: DraggableStateSnapshot
      ) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
          }}
          data-currently-playing={isCurrentlyPlaying}
        >
          <PlaylistItemContent
            item={item}
            style={{}}
            isDragging={isDragging}
            isCurrentlyPlaying={isCurrentlyPlaying}
          />
        </div>
      )}
    </Draggable>
  );
});

DraggableItem.displayName = "DraggableItem";

// Memoized playlist items component
const PlaylistItems = memo(({ items }: { items: UnifiedPlaylistItem[] }) => {
  return (
    <div className="space-y-2 w-full">
      {items.map((item, index) => (
        <DraggableItem
          key={`${item.type}-${item.id}`}
          item={item}
          index={index}
        />
      ))}
    </div>
  );
});

PlaylistItems.displayName = "PlaylistItems";

// Memoized droppable content
const DroppableContent = memo(
  ({
    provided,
    snapshot,
    items,
  }: {
    provided: DroppableProvided;
    snapshot: DroppableStateSnapshot;
    items: UnifiedPlaylistItem[];
  }) => {
    return (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`w-full transition-colors duration-200 ${
          snapshot.isDraggingOver ? "bg-gray-100/10" : ""
        }`}
      >
        <PlaylistItems items={items} />
        {provided.placeholder}
      </div>
    );
  },
  (prev, next) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prev.items === next.items &&
      prev.snapshot.isDraggingOver === next.snapshot.isDraggingOver
    );
  }
);

DroppableContent.displayName = "DroppableContent";

type PlaylistFilter = "all" | "youtube" | "spotify";

// Main component with stable references
const UnifiedPlaylistView = () => {
  const { unified, youtube, spotify } = useUnifiedContext();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(unified.playlistName);
  const playlistContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<PlaylistFilter>("all");

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update tempName when playlist name changes
  useEffect(() => {
    console.log(
      "Playlist name changed in UnifiedPlaylistView:",
      unified.playlistName,
      "isEditingName:",
      isEditingName
    );
    if (!isEditingName) {
      setTempName(unified.playlistName);
    }
  }, [unified.playlistName, isEditingName]);

  // Auto-scroll to currently playing song
  useEffect(() => {
    const scrollToCurrentlyPlaying = () => {
      if (!playlistContainerRef.current) return;

      const currentlyPlayingElement =
        playlistContainerRef.current.querySelector(
          '[data-currently-playing="true"]'
        ) as HTMLElement;

      if (currentlyPlayingElement) {
        currentlyPlayingElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    };

    // Small delay to ensure the DOM has updated
    const timeoutId = setTimeout(scrollToCurrentlyPlaying, 100);
    return () => clearTimeout(timeoutId);
  }, [unified.playlist, youtube.selectedVideo, spotify.currentSong]);

  // Memoize playlist items to prevent unnecessary re-renders
  const playlistItems = useMemo(() => {
    return unified.playlist.map((item) => ({
      id: item.id,
      type: item.type,
      data: item.data,
    }));
  }, [unified.playlist]);

  // Filter by service when user selects YouTube or Spotify
  const filteredPlaylistItems = useMemo(() => {
    if (serviceFilter === "all") return playlistItems;
    const type =
      serviceFilter === "youtube" ? ServiceType.Youtube : ServiceType.Spotify;
    return playlistItems.filter((item) => item.type === type);
  }, [playlistItems, serviceFilter]);

  // Memoize handlers to prevent unnecessary re-renders
  const handlePlaylistNameChange = useCallback(
    (newName: string) => {
      console.log("handlePlaylistNameChange called with:", newName);

      // Validate the playlist name
      const trimmedName = newName.trim();
      if (!trimmedName) {
        console.warn(
          "Playlist name cannot be empty, reverting to previous name"
        );
        setTempName(unified.playlistName);
        return;
      }

      // Only update if the name actually changed
      if (trimmedName !== unified.playlistName) {
        unified.setPlaylistName(trimmedName);
        console.log(
          "setPlaylistName called for unified playlist with:",
          trimmedName
        );
      }
    },
    [unified]
  );

  return (
    <div className="flex flex-col h-full bg-black/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          {/* Save button for unsaved changes */}
          {unified.hasUnsavedChanges && (
            <Button
              onClick={() => {
                console.log("Save button clicked from playlist view!");
                unified.saveCurrentPlaylist();
              }}
              variant="secondary"
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save
            </Button>
          )}

          <div className="flex items-center space-x-2">
            {isEditingName ? (
              <Input
                value={tempName}
                onChange={setTempName}
                variant="ghost"
                size="sm"
                className="bg-transparent border-b border-white/20 focus:border-white/40 px-1"
                onBlur={() => {
                  console.log("Input onBlur, tempName:", tempName);
                  setIsEditingName(false);
                  handlePlaylistNameChange(tempName);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingName(false);
                    handlePlaylistNameChange(tempName);
                  } else if (e.key === "Escape") {
                    setIsEditingName(false);
                    setTempName(unified.playlistName); // Reset to original name
                  }
                }}
                onFocus={() => {}}
                autoFocus
              />
            ) : (
              <div className="flex items-center space-x-2">
                <h2
                  className="text-lg font-semibold cursor-pointer hover:text-white/80 transition-colors text-[#FF6B6B]"
                  onClick={() => {
                    console.log(
                      "Starting to edit playlist name, current name:",
                      unified.playlistName
                    );
                    setTempName(unified.playlistName);
                    setIsEditingName(true);
                  }}
                >
                  {isClient ? unified.playlistName : "Create a new playlist"}
                </h2>
                {unified.hasUnsavedChanges && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30">
                    Unsaved
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Service filter: click YouTube or Spotify to show only that service's songs */}
          <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1 bg-black/20">
            <button
              type="button"
              onClick={() =>
                setServiceFilter((prev) =>
                  prev === "youtube" ? "all" : "youtube"
                )
              }
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md min-h-[36px] sm:min-h-[32px] transition-colors touch-manipulation ${
                serviceFilter === "youtube"
                  ? "bg-[#FF0000]/30 text-[#FF0000] border border-[#FF0000]/50"
                  : "text-gray-400 hover:text-[#FF0000] hover:bg-white/5 border border-transparent"
              }`}
              title={
                serviceFilter === "youtube"
                  ? "Show all (click again to clear filter)"
                  : "Show only YouTube tracks"
              }
            >
              <ServiceIcon
                service="youtube"
                size="sm"
                variant={serviceFilter === "youtube" ? "filled" : "default"}
              />
              <span className="text-xs font-medium hidden sm:inline">
                YouTube
              </span>
              {unified.playlist.some((i) => i.type === ServiceType.Youtube) && (
                <span className="text-xs opacity-80">
                  (
                  {
                    unified.playlist.filter(
                      (i) => i.type === ServiceType.Youtube
                    ).length
                  }
                  )
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                setServiceFilter((prev) =>
                  prev === "spotify" ? "all" : "spotify"
                )
              }
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md min-h-[36px] sm:min-h-[32px] transition-colors touch-manipulation ${
                serviceFilter === "spotify"
                  ? "bg-[#1DB954]/30 text-[#1DB954] border border-[#1DB954]/50"
                  : "text-gray-400 hover:text-[#1DB954] hover:bg-white/5 border border-transparent"
              }`}
              title={
                serviceFilter === "spotify"
                  ? "Show all (click again to clear filter)"
                  : "Show only Spotify tracks"
              }
            >
              <ServiceIcon
                service="spotify"
                size="sm"
                variant={serviceFilter === "spotify" ? "filled" : "default"}
              />
              <span className="text-xs font-medium hidden sm:inline">
                Spotify
              </span>
              {unified.playlist.some((i) => i.type === ServiceType.Spotify) && (
                <span className="text-xs opacity-80">
                  (
                  {
                    unified.playlist.filter(
                      (i) => i.type === ServiceType.Spotify
                    ).length
                  }
                  )
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Content */}
      <div
        ref={playlistContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4"
      >
        <Droppable droppableId="unified-playlist">
          {(provided, snapshot) => (
            <DroppableContent
              provided={provided}
              snapshot={snapshot}
              items={filteredPlaylistItems}
            />
          )}
        </Droppable>
      </div>
    </div>
  );
};

export default UnifiedPlaylistView;
