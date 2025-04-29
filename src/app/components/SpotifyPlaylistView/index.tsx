import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FaTrash,
  FaPlay,
  FaTrashAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { Song } from "../../../types/playerTypes";
import { usePlaying } from "../../../context/Playing";
import Image from "next/image";

const SpotifyPlaylistView: React.FC = () => {
  const { currentSong, setCurrentSong, playlist, setPlaylist } = usePlaying();

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
    <div className="bg-black/80 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Playlist</h2>
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
      <div className="relative mb-8">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <button
            onClick={scrollLeft}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-300"
          >
            <FaChevronLeft />
          </button>
        </div>
        <Droppable droppableId="vinyl-slider" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex space-x-4 overflow-x-auto scrollbar-hide py-4 px-12"
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
                        className={`flex-shrink-0 w-[180px] h-[180px] transition-all duration-300 ${
                          snapshot.isDragging
                            ? "scale-110 z-[9999] ring-2 ring-[#1DB954] ring-opacity-50 shadow-[0_0_30px_rgba(29,185,84,0.5)] animate-pulse"
                            : "hover:scale-105 hover:z-10"
                        } ${
                          song.id === currentSong?.id
                            ? "ring-2 ring-green-500"
                            : ""
                        }`}
                        style={{
                          ...provided.draggableProps.style,
                          position: snapshot.isDragging ? "fixed" : "relative",
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
                                <div className="w-full h-full bg-gradient-to-br from-green-600 via-green-500 to-green-700 rounded-full shadow-[0_0_12px_#0008_inset]" />
                              )}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--background)] border-2 border-[var(--foreground)] z-20" />
                          </div>
                        </div>

                        {/* Song Info Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-4 bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <span className="text-white text-sm font-bold truncate w-full text-center">
                            {song.title}
                          </span>
                          <span className="text-white/80 text-xs truncate w-full text-center">
                            {song.artist.name}
                          </span>
                          <div className="flex space-x-3 mt-2">
                            <button
                              onClick={() => handlePlay(song)}
                              className={`${
                                song.id === currentSong?.id
                                  ? "text-green-400"
                                  : "text-green-500 hover:text-green-400"
                              }`}
                            >
                              <FaPlay />
                            </button>
                            <button
                              onClick={() => handleRemove(index)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <FaTrash />
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
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors duration-300"
          >
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* List View */}
      <Droppable droppableId="playlist-list">
        {(provided) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
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
                      className={`flex items-center justify-between text-white border-2 ${
                        song.id === currentSong?.id
                          ? "border-green-500 bg-green-900/30"
                          : "border-white/10 bg-black/50"
                      } transition-colors duration-200 ease-in-out hover:bg-black/70 p-3 rounded-lg cursor-grab active:cursor-grabbing ${
                        snapshot.isDragging
                          ? "ring-2 ring-[#1DB954] ring-opacity-50 shadow-[0_0_30px_rgba(29,185,84,0.5)] animate-pulse"
                          : ""
                      }`}
                    >
                      <span className="truncate flex-grow">
                        {song.title} - {song.artist.name}
                      </span>
                      <div className="flex space-x-3 ml-4">
                        <button
                          onClick={() => handlePlay(song)}
                          className={`${
                            song.id === currentSong?.id
                              ? "text-green-400"
                              : "text-green-500 hover:text-green-400"
                          }`}
                        >
                          <FaPlay />
                        </button>
                        <button
                          onClick={() => handleRemove(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <FaTrash />
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
  );
};

export default SpotifyPlaylistView;
