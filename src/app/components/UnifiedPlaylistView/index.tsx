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
import { useUnifiedContext } from "@/context/UnifiedContext";
import { FaYoutube, FaSpotify } from "react-icons/fa";
import { ServiceType } from "@/types/playerTypes";
import { YoutubeVideo } from "@/app/components/Services/YtService";
import { Song } from "@/types/playerTypes";
import { PlaylistItem } from "./PlaylistItem";

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
    return (
      <div
        className={`flex items-center space-x-4 p-3 ${
          isDragging ? "bg-[#FF6B6B]/10" : "hover:bg-[#FF6B6B]/5"
        } transition-colors ${
          isCurrentlyPlaying
            ? "border-2 border-[#FF6B6B] shadow-[0_0_8px_rgba(255,107,107,0.6)]"
            : ""
        }`}
        style={style}
      >
        <PlaylistItem item={item.data} service={item.type} />
        <div className="flex-shrink-0">
          {item.type === ServiceType.Youtube ? (
            <FaYoutube className="text-[#FF0000]" size={16} />
          ) : (
            <FaSpotify className="text-[#1DB954]" size={16} />
          )}
        </div>
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

  // Debug log
  console.log(
    `Item ${item.id} (${item.type}): isCurrentlyPlaying = ${isCurrentlyPlaying}`
  );

  return (
    <Draggable draggableId={`${item.type}-${item.id}`} index={index}>
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
    <div className="space-y-2">
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
        className={`space-y-2 transition-colors duration-200 ${
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

// Main component with stable references
const UnifiedPlaylistView = () => {
  const { unified, youtube, spotify } = useUnifiedContext();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(unified.playlistName);
  const playlistContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

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

  // Memoize handlers to prevent unnecessary re-renders
  const handleClearAll = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all playlists?")) {
      unified.setPlaylist([]);
    }
  }, [unified.setPlaylist]);

  const handlePlaylistNameChange = useCallback(
    (newName: string) => {
      console.log("handlePlaylistNameChange called with:", newName);
      unified.setPlaylistName(newName);
      console.log("setPlaylistName called for unified playlist");
    },
    [unified.setPlaylistName]
  );

  return (
    <div className="flex flex-col h-full bg-black/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isEditingName ? (
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  console.log("Input onBlur, tempName:", tempName);
                  setIsEditingName(false);
                  handlePlaylistNameChange(tempName);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    console.log("Input onKeyDown Enter, tempName:", tempName);
                    setIsEditingName(false);
                    handlePlaylistNameChange(tempName);
                  }
                }}
                className="bg-transparent border-b border-white/20 focus:border-white/40 outline-none px-1"
                autoFocus
              />
            ) : (
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
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {(() => {
              const youtubeCount = unified.playlist.filter(
                (item) => item.type === ServiceType.Youtube
              ).length;
              const spotifyCount = unified.playlist.filter(
                (item) => item.type === ServiceType.Spotify
              ).length;
              return (
                <>
                  {youtubeCount > 0 && (
                    <div className="flex items-center text-red-500">
                      <FaYoutube className="mr-1" />
                      <span className="text-sm">{youtubeCount}</span>
                    </div>
                  )}
                  {spotifyCount > 0 && (
                    <div className="flex items-center text-green-500">
                      <FaSpotify className="mr-1" />
                      <span className="text-sm">{spotifyCount}</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <button
            onClick={handleClearAll}
            className="text-red-500 hover:text-red-400 transition-colors duration-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Playlist Content */}
      <div ref={playlistContainerRef} className="flex-1 overflow-y-auto p-4">
        <Droppable droppableId="unified-playlist">
          {(provided, snapshot) => (
            <DroppableContent
              provided={provided}
              snapshot={snapshot}
              items={playlistItems}
            />
          )}
        </Droppable>
      </div>
    </div>
  );
};

export default UnifiedPlaylistView;
