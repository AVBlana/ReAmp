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
  const listContainerRef = useRef<HTMLDivElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (currentItemId && listContainerRef.current) {
      const currentItem = listContainerRef.current.querySelector(
        `[data-item-id="${currentItemId}"]`
      );
      if (currentItem) {
        const containerRect = listContainerRef.current.getBoundingClientRect();
        const itemRect = currentItem.getBoundingClientRect();

        if (
          itemRect.top < containerRect.top ||
          itemRect.bottom > containerRect.bottom
        ) {
          currentItem.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }
  }, [currentItemId]);

  useEffect(() => {
    if (currentItemId && sliderContainerRef.current) {
      const currentItem = sliderContainerRef.current.querySelector(
        `[data-slider-item-id="${currentItemId}"]`
      );
      if (currentItem) {
        const containerRect =
          sliderContainerRef.current.getBoundingClientRect();
        const itemRect = currentItem.getBoundingClientRect();

        if (
          itemRect.left < containerRect.left ||
          itemRect.right > containerRect.right
        ) {
          currentItem.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }
  }, [currentItemId]);

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
        <div
          onClick={scrollLeft}
          className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/90 to-transparent z-10 flex items-center cursor-pointer hover:from-black transition-colors duration-300"
        >
          <div className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-300">
            <FaChevronLeft size={24} />
          </div>
        </div>
        <Droppable droppableId={`${droppableId}-slider`} direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex space-x-8 overflow-x-auto scrollbar-hide py-4 px-24 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[var(--theme-primary)] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-[var(--theme-primary-hover)]"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${theme.primary} transparent`,
              }}
            >
              <div ref={sliderContainerRef} className="flex space-x-8">
                {items.map((item, index) => (
                  <Draggable
                    key={`${draggablePrefix}-slider-${item.id}`}
                    draggableId={`${draggablePrefix}-slider-${item.id}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        data-slider-item-id={item.id}
                        className="flex-shrink-0 w-[160px] transition-all duration-300 group first:ml-4 last:mr-4"
                        style={{
                          ...provided.draggableProps.style,
                        }}
                      >
                        <div className="relative w-[160px] h-[160px] rounded-full group">
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
                          </div>

                          {/* Overlay with Controls */}
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full flex flex-col items-center justify-center gap-3 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlay(item);
                              }}
                              className="p-3 rounded-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 transition-all duration-200 hover:scale-110 shadow-lg"
                            >
                              {item.id === currentItemId ? (
                                <FaPause size={20} className="text-white" />
                              ) : (
                                <FaPlay size={20} className="text-white" />
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemove(index);
                              }}
                              className="p-3 rounded-full bg-red-500 hover:bg-red-500/90 transition-all duration-200 hover:scale-110 shadow-lg"
                            >
                              <FaTrash size={16} className="text-white" />
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
            </div>
          )}
        </Droppable>
        <div
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/90 to-transparent z-10 flex items-center justify-end cursor-pointer hover:from-black transition-colors duration-300"
        >
          <div className="w-12 h-12 flex items-center justify-center text-white/80 hover:text-white transition-colors duration-300">
            <FaChevronRight size={24} />
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="flex-1 min-h-0 relative" ref={listContainerRef}>
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/90 to-transparent z-10 pointer-events-none" />
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-1 h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-[var(--theme-primary)] [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-[var(--theme-primary-hover)] pr-2 pt-12 pb-12"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `${theme.primary} transparent`,
              }}
            >
              {items.map((item, index) => (
                <Draggable
                  key={`${draggablePrefix}-list-${item.id}`}
                  draggableId={`${draggablePrefix}-list-${item.id}`}
                  index={index}
                >
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      data-item-id={item.id}
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
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );
};

export default PlaylistView;
