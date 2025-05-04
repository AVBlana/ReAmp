import React, { useState, useEffect, useRef } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FaTrash,
  FaPlay,
  FaTrashAlt,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaCheck,
} from "react-icons/fa";
import { Song } from "@/types/playerTypes";
import { PlayingContext } from "@/context/Playing";
import Image from "next/image";
import { useContext } from "react";

const SpotifyPlaylistView: React.FC = () => {
  const {
    playlist,
    setPlaylist,
    setCurrentSong,
    currentSong,
    playlistName,
    setPlaylistName,
  } = useContext(PlayingContext);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playlistName);
  const listContainerRef = useRef<HTMLUListElement>(null);
  const vinylContainerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Add the animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 10px rgba(29,185,84,0.6), 0 0 20px rgba(29,185,84,0.4);
        }
        50% {
          box-shadow: 0 0 30px rgba(29,185,84,0.8), 0 0 50px rgba(29,185,84,0.6);
        }
      }
      .animate-glow {
        animation: glow 1.5s ease-in-out infinite;
      }

      /* Futuristic Scrollbar Styles */
      .futuristic-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .futuristic-scrollbar::-webkit-scrollbar-track {
        background: rgba(26, 26, 26, 0.3);
        border-radius: 10px;
        backdrop-filter: blur(10px);
      }

      .futuristic-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(45deg, #1DB954, #00ff9d);
        border-radius: 10px;
        border: 2px solid rgba(29, 185, 84, 0.2);
        box-shadow: 0 0 15px rgba(29, 185, 84, 0.5);
        transition: all 0.3s ease;
      }

      .futuristic-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(45deg, #00ff9d, #1DB954);
        box-shadow: 0 0 20px rgba(29, 185, 84, 0.8);
      }

      .futuristic-scrollbar::-webkit-scrollbar-corner {
        background: transparent;
      }

      /* For Firefox */
      .futuristic-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #1DB954 rgba(26, 26, 26, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add scroll to current song effect
  useEffect(() => {
    if (!currentSong) return;

    const scrollToCurrentSong = () => {
      // Scroll in list view
      if (listContainerRef.current) {
        const currentSongElement = listContainerRef.current.querySelector(
          `[data-song-id="${currentSong.id}"]`
        );
        if (currentSongElement) {
          const containerRect =
            listContainerRef.current.getBoundingClientRect();
          const elementRect = currentSongElement.getBoundingClientRect();

          if (
            elementRect.top < containerRect.top ||
            elementRect.bottom > containerRect.bottom
          ) {
            currentSongElement.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        }
      }

      // Scroll in vinyl view
      if (vinylContainerRef.current) {
        const currentVinylElement = vinylContainerRef.current.querySelector(
          `[data-song-id="${currentSong.id}"]`
        );
        if (currentVinylElement) {
          const containerRect =
            vinylContainerRef.current.getBoundingClientRect();
          const elementRect = currentVinylElement.getBoundingClientRect();

          if (
            elementRect.left < containerRect.left ||
            elementRect.right > containerRect.right
          ) {
            currentVinylElement.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center",
            });
          }
        }
      }
    };

    // Add a small delay to ensure the DOM has updated
    const timeoutId = setTimeout(scrollToCurrentSong, 100);
    return () => clearTimeout(timeoutId);
  }, [currentSong]);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTempName(playlistName);
    // Focus the input after it's rendered
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      setPlaylistName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(playlistName);
    }
  };

  const handleRemove = (index: number) => {
    const updatedPlaylist = [...playlist];
    updatedPlaylist.splice(index, 1);
    setPlaylist(updatedPlaylist);
  };

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire playlist?")) {
      setPlaylist([]);
    }
  };

  const scrollLeft = () => {
    const container = document.querySelector(".scrollbar-hide");
    if (container) {
      container.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    const container = document.querySelector(".scrollbar-hide");
    if (container) {
      container.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative rounded-2xl shadow-2xl p-4 overflow-hidden bg-[#1A1A1A] border border-[#1DB954]/20 h-[700px]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/5 to-transparent" />
      <div className="relative z-10 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  className="text-2xl font-bold bg-transparent border-b border-[#1DB954] focus:outline-none focus:border-[#1DB954] text-white"
                />
                <button
                  onClick={handleNameSave}
                  className="p-1 text-[#1DB954] hover:text-[#1DB954]/80 transition-colors"
                >
                  <FaCheck size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  onDoubleClick={handleNameEdit}
                  className="text-2xl font-bold text-white cursor-pointer hover:text-[#1DB954] transition-colors"
                >
                  {playlistName}
                </h2>
                <button
                  onClick={handleNameEdit}
                  className="p-1 text-[#1DB954] hover:text-[#1DB954]/80 transition-colors"
                >
                  <FaEdit size={16} />
                </button>
              </div>
            )}
          </div>
          {playlist.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-300"
              title="Clear all tracks"
            >
              <FaTrashAlt size={14} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Vinyl Record Slider */}
        <div className="relative mb-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={scrollLeft}
              className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-300"
            >
              <FaChevronLeft />
            </button>
          </div>
          <Droppable droppableId="vinyl-slider" direction="horizontal">
            {(provided) => (
              <div
                ref={(el) => {
                  provided.innerRef(el);
                  vinylContainerRef.current = el;
                }}
                {...provided.droppableProps}
                className="flex space-x-4 overflow-x-auto futuristic-scrollbar py-2 px-10"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {playlist.map((song: Song, index: number) =>
                  song && song.id ? (
                    <Draggable
                      key={`vinyl-${song.id}`}
                      draggableId={`vinyl-${song.id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          data-song-id={song.id}
                          className={`flex-shrink-0 w-[140px] h-[140px] transition-all duration-300 ${
                            snapshot.isDragging
                              ? "scale-110 z-[9999] ring-2 ring-[#1DB954] ring-opacity-50"
                              : "hover:scale-105 hover:z-10"
                          } ${
                            song.id === currentSong?.id
                              ? "ring-2 ring-[#1DB954]"
                              : ""
                          }`}
                          style={{
                            ...provided.draggableProps.style,
                            position: snapshot.isDragging
                              ? "fixed"
                              : "relative",
                          }}
                        >
                          {/* Vinyl Record */}
                          <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] rounded-full shadow-[0_0_0_8px_var(--background),0_0_32px_#0008_inset] flex items-center justify-center border-4 border-[var(--foreground)] transform hover:rotate-12 transition-transform duration-300">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 rounded-full bg-[var(--background)] shadow-[0_0_0_2px_var(--foreground),0_0_12px_#fff8_inset] overflow-hidden z-10 flex items-center justify-center">
                                {song.artwork?.big?.url ||
                                song.artwork?.medium?.url ||
                                song.artwork?.small?.url ? (
                                  <Image
                                    src={
                                      song.artwork.big?.url ||
                                      song.artwork.medium?.url ||
                                      song.artwork.small?.url
                                    }
                                    alt={song.title}
                                    width={song.artwork.big?.width || 640}
                                    height={song.artwork.big?.height || 640}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-red-600 via-red-500 to-red-700 rounded-full shadow-[0_0_12px_#0008_inset]" />
                                )}
                              </div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--foreground)] z-20" />
                            </div>
                          </div>

                          {/* Song Info Overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-end p-2 bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white text-xs font-bold truncate w-full text-center">
                              {song.title}
                            </span>
                            <span className="text-white/80 text-[10px] truncate w-full text-center">
                              {song.artist.name}
                            </span>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={() => handlePlay(song)}
                                className={`${
                                  song.id === currentSong?.id
                                    ? "text-[#1DB954]"
                                    : "text-[#1DB954] hover:text-[#1DB954]/80"
                                }`}
                              >
                                <FaPlay size={12} />
                              </button>
                              <button
                                onClick={() => handleRemove(index)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ) : null
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={scrollRight}
              className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-300"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* List View */}
        <div className="flex-1 min-h-0">
          <Droppable droppableId="playlist-list">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={(el) => {
                  provided.innerRef(el);
                  listContainerRef.current = el;
                }}
                className="space-y-1 h-full overflow-y-auto futuristic-scrollbar pr-2"
              >
                {playlist.map((song: Song, index: number) =>
                  song && song.id ? (
                    <Draggable
                      key={`list-${song.id}`}
                      draggableId={`list-${song.id}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          data-song-id={song.id}
                          onMouseEnter={() => setHoveredIndex(index)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`flex items-center justify-between text-white border-2 ${
                            song.id === currentSong?.id
                              ? "border-[#1DB954] bg-[#1DB954]/10 shadow-[0_0_30px_rgba(29,185,84,0.5)] animate-glow"
                              : "border-white/10 bg-black/50"
                          } transition-colors duration-200 ease-in-out hover:bg-black/70 p-2 rounded-lg cursor-grab active:cursor-grabbing ${
                            snapshot.isDragging
                              ? "ring-2 ring-[#1DB954] ring-opacity-50 shadow-[0_0_30px_rgba(29,185,84,0.5)] animate-glow"
                              : ""
                          }`}
                          style={{
                            ...provided.draggableProps.style,
                            height: "3rem",
                          }}
                        >
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <div className="w-8 h-8 flex-shrink-0 rounded overflow-hidden">
                              {song.artwork?.small?.url ? (
                                <Image
                                  src={song.artwork.small.url}
                                  alt={song.title}
                                  width={32}
                                  height={32}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-red-600 via-red-500 to-red-700" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-sm font-medium relative ${
                                  hoveredIndex === index
                                    ? "overflow-hidden"
                                    : "truncate"
                                }`}
                              >
                                <span
                                  className={`${
                                    hoveredIndex === index
                                      ? "animate-marquee whitespace-nowrap inline-block"
                                      : "truncate"
                                  }`}
                                  style={{
                                    animationDuration: "10s",
                                    animationTimingFunction: "linear",
                                    animationIterationCount: "infinite",
                                  }}
                                >
                                  {song.title}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 truncate">
                                {song.artist.name}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-2 flex-shrink-0">
                            <button
                              onClick={() => handlePlay(song)}
                              className={`${
                                song.id === currentSong?.id
                                  ? "text-[#1DB954]"
                                  : "text-[#1DB954] hover:text-[#1DB954]/80"
                              }`}
                            >
                              <FaPlay size={14} />
                            </button>
                            <button
                              onClick={() => handleRemove(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ) : null
                )}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
};

export default SpotifyPlaylistView;
