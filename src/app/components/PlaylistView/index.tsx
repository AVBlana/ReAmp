import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FaTrash,
  FaPlay,
  FaPause,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import "./styles.css";

interface PlaylistItem {
  id: string;
  title: string;
  artist?: {
    name: string;
  };
  artwork?: {
    small: {
      url: string;
      width: number;
      height: number;
    };
  };
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
}

interface PlaylistViewProps {
  items: PlaylistItem[];
  currentItemId: string | null;
  onPlay: (item: PlaylistItem) => void;
  onRemove: (index: number) => void;
  onClearAll: () => void;
  playlistName: string;
  onPlaylistNameChange: (name: string) => void;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  droppableId: string;
  draggablePrefix: string;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  items,
  currentItemId,
  onPlay,
  onRemove,
  onClearAll,
  playlistName,
  onPlaylistNameChange,
  theme,
  droppableId,
  draggablePrefix,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playlistName);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--theme-primary",
      theme.primary
    );
    document.documentElement.style.setProperty(
      "--theme-primary-hover",
      `${theme.primary}80`
    );
  }, [theme]);

  const handleNameEdit = () => {
    setIsEditingName(true);
    setTempName(playlistName);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  const handleNameSave = () => {
    if (tempName.trim()) {
      onPlaylistNameChange(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSave();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(playlistName);
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
    <div className="flex flex-col h-full bg-black/50 rounded-lg p-4">
      {/* Header */}
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
              className="bg-transparent border-b border-white/20 text-white focus:outline-none focus:border-white/40"
            />
          ) : (
            <h2
              onClick={handleNameEdit}
              className="text-xl font-bold text-white cursor-pointer hover:text-white/80"
            >
              {playlistName}
            </h2>
          )}
        </div>
        <button
          onClick={onClearAll}
          className="text-red-500 hover:text-red-400 transition-colors duration-200"
        >
          Clear All
        </button>
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
        <Droppable droppableId={`${droppableId}-slider`} direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex space-x-8 overflow-x-auto scrollbar-hide py-4 px-16 futuristic-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${theme.primary} transparent`,
              }}
            >
              {items.map((item, index) => (
                <Draggable
                  key={`${draggablePrefix}-${item.id}`}
                  draggableId={`${draggablePrefix}-${item.id}`}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex-shrink-0 w-[160px] transition-all duration-300 ${
                        item.id === currentItemId
                          ? `ring-2 ring-[${theme.primary}]`
                          : ""
                      }`}
                      style={{
                        ...provided.draggableProps.style,
                      }}
                    >
                      <div className="relative w-[160px] h-[160px] group">
                        {/* Vinyl Record */}
                        <div
                          className={`absolute inset-0 rounded-full bg-[url('/vinylDisk.png')] bg-center bg-no-repeat bg-[length:130%_130%] shadow-[0_0_0_4px_var(--background),0_0_16px_#0008_inset] flex items-center justify-center border-2 border-[var(--foreground)] transform-origin-center transition-transform duration-200 ease-out ${
                            item.id === currentItemId ? "animate-spin" : ""
                          }`}
                        >
                          {/* Album Art */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/5 h-3/5 rounded-full bg-[var(--background)] shadow-[0_0_0_2px_var(--foreground),0_0_8px_#fff8_inset] overflow-hidden z-10 flex items-center justify-center">
                            <Image
                              src={
                                item.artwork?.small.url ||
                                item.thumbnail?.url ||
                                ""
                              }
                              alt={item.title}
                              width={
                                item.artwork?.small.width ||
                                item.thumbnail?.width ||
                                140
                              }
                              height={
                                item.artwork?.small.height ||
                                item.thumbnail?.height ||
                                140
                              }
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Center Hole */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[var(--background)] border border-[var(--foreground)] z-20" />
                        </div>

                        {/* Overlay with Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex flex-col items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlay(item);
                            }}
                            className={`p-2 rounded-full bg-[${theme.primary}]/80 hover:bg-[${theme.primary}] transition-colors duration-200`}
                          >
                            {item.id === currentItemId ? (
                              <FaPause size={16} className="text-white" />
                            ) : (
                              <FaPlay size={16} className="text-white" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemove(index);
                            }}
                            className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors duration-200"
                          >
                            <FaTrash size={14} className="text-white" />
                          </button>
                        </div>
                      </div>

                      {/* Title and Artist */}
                      <div className="mt-2 text-center">
                        <span className="text-white text-sm font-medium truncate block">
                          {item.title}
                        </span>
                        {item.artist && (
                          <span className="text-white/70 text-xs truncate block">
                            {item.artist.name}
                          </span>
                        )}
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
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-1 h-full overflow-y-auto futuristic-scrollbar pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${theme.primary} transparent`,
              }}
            >
              {items.map((item, index) => (
                <Draggable
                  key={`${draggablePrefix}-${item.id}`}
                  draggableId={`${draggablePrefix}-${item.id}`}
                  index={index}
                >
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className={`flex items-center justify-between text-white border-2 ${
                        item.id === currentItemId
                          ? `border-[${theme.primary}] bg-[${theme.primary}]/30 shadow-[0_0_30px_${theme.primary}/50] animate-glow`
                          : "border-white/10 bg-black/50"
                      } transition-colors duration-200 ease-in-out hover:bg-black/70 p-2 rounded-lg cursor-grab active:cursor-grabbing ${
                        hoveredIndex === index
                          ? `ring-2 ring-[${theme.primary}] ring-opacity-50 shadow-[0_0_30px_${theme.primary}/50] animate-glow`
                          : ""
                      }`}
                      style={{
                        ...provided.draggableProps.style,
                        height: "3rem",
                      }}
                    >
                      <div className="flex items-center space-x-3 flex-grow min-w-0">
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={
                              item.artwork?.small.url ||
                              item.thumbnail?.url ||
                              ""
                            }
                            alt={item.title}
                            width={
                              item.artwork?.small.width ||
                              item.thumbnail?.width ||
                              32
                            }
                            height={
                              item.artwork?.small.height ||
                              item.thumbnail?.height ||
                              32
                            }
                            className="rounded-md"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {item.title}
                          </div>
                          {item.artist && (
                            <div className="text-xs text-gray-400 truncate">
                              {item.artist.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlay(item);
                          }}
                          className={`${
                            item.id === currentItemId
                              ? `text-[${theme.primary}]`
                              : `text-[${theme.secondary}] hover:text-[${theme.primary}]`
                          }`}
                        >
                          {item.id === currentItemId ? (
                            <FaPause size={14} />
                          ) : (
                            <FaPlay size={14} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(index);
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
  );
};

export default PlaylistView;
