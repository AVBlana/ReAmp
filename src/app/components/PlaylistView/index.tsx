import React, { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { useAppContext } from "@/app/AppContext";
import { FaTrash, FaPlay, FaTrashAlt } from "react-icons/fa";

const PlaylistView: React.FC = () => {
  const { playlist, setPlaylist, setSelectedVideo, selectedVideo } =
    useAppContext();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleRemove = (index: number) => {
    const updatedPlaylist = [...playlist];
    updatedPlaylist.splice(index, 1);
    setPlaylist(updatedPlaylist);
  };

  const handlePlay = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire playlist?")) {
      setPlaylist([]);
    }
  };

  return (
    <>
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
      <Droppable droppableId="playlist">
        {(provided) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {playlist.map((video, index) => (
              <Draggable
                key={video.id.videoId}
                draggableId={video.id.videoId}
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
                        ? "border-green-500 bg-green-900/30"
                        : "border-white/10 bg-black/50"
                    } transition-colors duration-200 ease-in-out hover:bg-black/70 p-3 rounded-lg ${
                      snapshot.isDragging
                        ? "ring-2 ring-[#FF0000] ring-opacity-50 shadow-[0_0_30px_rgba(255,0,0,0.5)] animate-pulse"
                        : ""
                    }`}
                  >
                    <div className="flex-grow min-w-0 overflow-hidden">
                      <div
                        className={`${
                          hoveredIndex === index
                            ? "animate-marquee whitespace-nowrap"
                            : "truncate"
                        }`}
                        style={{
                          animationDuration: "10s",
                          animationTimingFunction: "linear",
                          animationIterationCount: "infinite",
                        }}
                      >
                        {video.snippet.title}
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-4">
                      <button
                        onClick={() => handlePlay(video.id.videoId)}
                        className={`${
                          video.id.videoId === selectedVideo
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
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </>
  );
};

export default PlaylistView;
