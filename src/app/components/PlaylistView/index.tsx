import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useAppContext } from "@/app/AppContext";
import {
  FaTrash,
  FaPlay,
  FaTrashAlt,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaCheck,
} from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const PlaylistView: React.FC = () => {
  const {
    playlist,
    setPlaylist,
    setSelectedVideo,
    selectedVideo,
    playlistName,
    setPlaylistName,
  } = useAppContext();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playlistName);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  const handlePlay = (videoId: string) => {
    console.log("Play clicked for video:", videoId);
    setSelectedVideo(videoId);
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

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 10px rgba(255,0,0,0.6), 0 0 20px rgba(255,0,0,0.4);
        }
        50% {
          box-shadow: 0 0 30px rgba(255,0,0,0.8), 0 0 50px rgba(255,0,0,0.6);
        }
      }
      .animate-glow {
        animation: glow 1.5s ease-in-out infinite;
      }

      /* YouTube Futuristic Scrollbar Styles */
      .youtube-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .youtube-scrollbar::-webkit-scrollbar-track {
        background: rgba(26, 26, 26, 0.3);
        border-radius: 10px;
        backdrop-filter: blur(10px);
      }

      .youtube-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(45deg, #FF0000, #ff4d4d);
        border-radius: 10px;
        border: 2px solid rgba(255, 0, 0, 0.2);
        box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        transition: all 0.3s ease;
      }

      .youtube-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(45deg, #ff4d4d, #FF0000);
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
      }

      .youtube-scrollbar::-webkit-scrollbar-corner {
        background: transparent;
      }

      /* For Firefox */
      .youtube-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #FF0000 rgba(26, 26, 26, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    console.log("PlaylistView - Selected video:", selectedVideo);
  }, [selectedVideo]);

  return (
    <div className="relative rounded-2xl shadow-2xl p-4 overflow-hidden bg-[#1A1A1A] border border-[#FF0000]/20 h-[700px]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000]/5 to-transparent" />
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
                  className="text-2xl font-bold bg-transparent border-b border-[#FF0000] focus:outline-none focus:border-[#FF0000] text-white"
                />
                <button
                  onClick={handleNameSave}
                  className="p-1 text-[#FF0000] hover:text-[#FF0000]/80 transition-colors"
                >
                  <FaCheck size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  onDoubleClick={handleNameEdit}
                  className="text-2xl font-bold text-white cursor-pointer hover:text-[#FF0000] transition-colors"
                >
                  {playlistName}
                </h2>
                <button
                  onClick={handleNameEdit}
                  className="p-1 text-[#FF0000] hover:text-[#FF0000]/80 transition-colors"
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

        {/* Thumbnail Slider */}
        <div className="relative mb-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={scrollLeft}
              className="w-12 h-12 bg-black/90 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors duration-300 shadow-lg hover:shadow-xl border border-white/10"
            >
              <FaChevronLeft size={20} />
            </button>
          </div>
          <Droppable droppableId="thumbnail-slider" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-4 overflow-x-auto scrollbar-hide py-2 px-10"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {playlist.map((video, index) => (
                  <Draggable
                    key={`thumbnail-${video.id.videoId}`}
                    draggableId={`thumbnail-${video.id.videoId}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex-shrink-0 w-[140px] h-[140px] transition-all duration-300 ${
                          snapshot.isDragging
                            ? "scale-110 z-[9999] ring-2 ring-[#FF0000] ring-opacity-50"
                            : "hover:scale-105"
                        } ${
                          video.id.videoId === selectedVideo
                            ? "ring-2 ring-red-500"
                            : ""
                        }`}
                        style={{
                          ...provided.draggableProps.style,
                          position: snapshot.isDragging ? "fixed" : "relative",
                        }}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={video.snippet.thumbnails.medium.url}
                            width={video.snippet.thumbnails.medium.width || 320}
                            height={
                              video.snippet.thumbnails.medium.height || 180
                            }
                            alt={video.snippet.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = video.snippet.thumbnails.default.url;
                            }}
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-end p-2 bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <span className="text-white text-xs font-bold truncate w-full text-center">
                              {video.snippet.title}
                            </span>
                            <span className="text-white/80 text-[10px] truncate w-full text-center">
                              {video.snippet.channelTitle}
                            </span>
                            <div className="flex space-x-2 mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlay(video.id.videoId);
                                }}
                                className={`${
                                  video.id.videoId === selectedVideo
                                    ? "text-green-400"
                                    : "text-green-500 hover:text-green-400"
                                }`}
                              >
                                <FaPlay size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(index);
                                }}
                                className="text-red-500 hover:text-red-400"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={scrollRight}
              className="w-12 h-12 bg-black/90 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors duration-300 shadow-lg hover:shadow-xl border border-white/10"
            >
              <FaChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* List View */}
        <div className="flex-1 min-h-0">
          <Droppable droppableId="playlist-list">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1 h-full overflow-y-auto youtube-scrollbar pr-2"
              >
                {playlist.map((video, index) => (
                  <Draggable
                    key={`list-${video.id.videoId}`}
                    draggableId={`list-${video.id.videoId}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className={`flex items-center justify-between text-white border-2 ${
                          video.id.videoId === selectedVideo
                            ? "border-red-500 bg-red-900/30 shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-glow"
                            : "border-white/10 bg-black/50"
                        } transition-colors duration-200 ease-in-out hover:bg-black/70 p-2 rounded-lg cursor-grab active:cursor-grabbing ${
                          snapshot.isDragging
                            ? "ring-2 ring-[#FF0000] ring-opacity-50 shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-glow"
                            : ""
                        }`}
                        style={{
                          ...provided.draggableProps.style,
                          height: "3rem",
                        }}
                      >
                        <div className="flex items-center gap-2 flex-grow min-w-0">
                          <div className="w-8 h-8 flex-shrink-0 rounded overflow-hidden">
                            <img
                              src={video.snippet.thumbnails.default.url}
                              alt={video.snippet.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  video.snippet.thumbnails.medium.url;
                              }}
                            />
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
                                {video.snippet.title}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 truncate">
                              {video.snippet.channelTitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlay(video.id.videoId);
                            }}
                            className={`${
                              video.id.videoId === selectedVideo
                                ? "text-green-400"
                                : "text-green-500 hover:text-green-400"
                            }`}
                          >
                            <FaPlay size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(index);
                            }}
                            className="text-red-500 hover:text-red-400"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
};

export default PlaylistView;
