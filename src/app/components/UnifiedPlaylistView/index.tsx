"use client";

import { FaYoutube, FaSpotify, FaTrash, FaPlay } from "react-icons/fa";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { ServiceType } from "@/types/playerTypes";
import { useState, useRef } from "react";

interface UnifiedPlaylistViewProps {
  className?: string;
}

interface PlaylistItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  service: ServiceType;
  index: number;
}

export default function UnifiedPlaylistView({
  className = "",
}: UnifiedPlaylistViewProps) {
  const { youtube, spotify } = useUnifiedContext();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTempName(youtube.playlistName || "New Playlist");
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      // Update both services' playlist names
      youtube.setPlaylistName(tempName.trim());
      spotify.setPlaylistName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(youtube.playlistName);
    }
  };

  const handlePlay = (id: string, service: ServiceType) => {
    if (service === ServiceType.Youtube) {
      // Find the video in the playlist
      const video = youtube.playlist.find((v) => v.id.videoId === id);
      if (video) {
        youtube.setSelectedVideo(id);
      }
    } else {
      // Find the song in the playlist
      const song = spotify.playlist.find((s) => s.id === id);
      if (song) {
        spotify.setCurrentSong(song);
      }
    }
  };

  const handleRemove = (id: string, service: ServiceType) => {
    if (service === ServiceType.Youtube) {
      youtube.removeFromPlaylist(id);
    } else {
      spotify.removeFromPlaylist(id);
    }
  };

  // Combine both playlists into a single array
  const playlistItems: PlaylistItem[] = [
    ...youtube.playlist.map((item, index) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      subtitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url,
      service: ServiceType.Youtube,
      index,
    })),
    ...spotify.playlist.map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.artist?.name || "Unknown Artist",
      thumbnail:
        item.artwork?.small?.url ||
        item.artwork?.medium?.url ||
        item.artwork?.big?.url ||
        "",
      service: ServiceType.Spotify,
      index: youtube.playlist.length + index,
    })),
  ];

  // Add custom scrollbar styles
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #FF6B6B, #FF8E8E);
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, #FF8E8E, #FFB6B6);
    }

    .playlist-container {
      position: relative;
    }

    .playlist-container::before,
    .playlist-container::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: 40px;
      pointer-events: none;
      z-index: 1;
    }

    .playlist-container::before {
      top: 0;
      background: linear-gradient(to bottom, 
        rgba(0, 0, 0, 0.9) 0%,
        rgba(0, 0, 0, 0.7) 30%,
        rgba(0, 0, 0, 0) 100%
      );
      height: 60px;
    }

    .playlist-container::after {
      bottom: 0;
      background: linear-gradient(to top, 
        rgba(0, 0, 0, 0.9) 0%,
        rgba(0, 0, 0, 0.7) 30%,
        rgba(0, 0, 0, 0) 100%
      );
      height: 60px;
    }
  `;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Add custom scrollbar styles */}
      <style>{scrollbarStyles}</style>

      {/* Playlist Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-b border-white/20 text-white focus:outline-none focus:border-white/40 text-xl font-semibold"
            />
          ) : (
            <h2
              onClick={handleNameEdit}
              className="text-xl font-semibold bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
            >
              {youtube.playlistName || "New Playlist"}
            </h2>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-[#FF0000]">
            <FaYoutube size={16} />
            <span className="text-sm">{youtube.playlist.length}</span>
          </div>
          <div className="flex items-center space-x-1 text-[#1DB954]">
            <FaSpotify size={16} />
            <span className="text-sm">{spotify.playlist.length}</span>
          </div>
        </div>
      </div>

      {/* Playlist */}
      <Droppable droppableId="unified-playlist">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-grow overflow-y-auto custom-scrollbar playlist-container rounded-lg border ${
              snapshot.isDraggingOver
                ? "border-[#FF6B6B]/40 bg-[#FF6B6B]/5"
                : "border-white/10"
            } transition-colors`}
          >
            {playlistItems.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>No tracks in playlist</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {playlistItems.map((item) => (
                  <Draggable
                    key={`${item.service}-${item.id}`}
                    draggableId={`${item.service}-${item.id}`}
                    index={item.index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-center space-x-4 p-3 ${
                          snapshot.isDragging
                            ? "bg-[#FF6B6B]/10"
                            : "hover:bg-[#FF6B6B]/5"
                        } transition-colors`}
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden">
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                          <h3 className="text-sm font-medium text-white truncate">
                            {item.title}
                          </h3>
                          <p className="text-xs text-gray-400 truncate">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePlay(item.id, item.service)}
                            className="p-2 text-[#1DB954] hover:bg-[#1DB954]/20 rounded-full transition-colors"
                          >
                            <FaPlay size={14} />
                          </button>
                          <button
                            onClick={() => handleRemove(item.id, item.service)}
                            className="p-2 text-gray-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/20 rounded-full transition-colors"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>

                        {/* Service Icon */}
                        <div className="flex-shrink-0">
                          {item.service === ServiceType.Youtube ? (
                            <FaYoutube className="text-[#FF0000]" size={16} />
                          ) : (
                            <FaSpotify className="text-[#1DB954]" size={16} />
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
