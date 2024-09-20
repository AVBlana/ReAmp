import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useAppContext } from "@/app/AppContext";
import { FaTrash, FaPlay } from "react-icons/fa";

const PlaylistView: React.FC = () => {
  const { playlist, setPlaylist, setSelectedVideo } = useAppContext();

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(playlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPlaylist(items);
  };

  const handleRemove = (index: number) => {
    const updatedPlaylist = [...playlist];
    updatedPlaylist.splice(index, 1);
    setPlaylist(updatedPlaylist);
  };

  const handlePlay = (videoId: string) => {
    setSelectedVideo(videoId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl text-black font-bold mb-4">Playlist</h2>
      <DragDropContext onDragEnd={onDragEnd}>
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
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="flex items-center justify-between text-black border-2 border-gray-400 bg-gray-100  transition-colors duration-200 ease-in-out hover:bg-gray-400 p-2 rounded"
                    >
                      <span className="truncate flex-grow">
                        {video.snippet.title}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handlePlay(video.id.videoId)}
                          className="text-green-500 hover:text-green-700"
                        >
                          <FaPlay />
                        </button>
                        <button
                          onClick={() => handleRemove(index)}
                          className="text-red-500 hover:text-red-700"
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
      </DragDropContext>
    </div>
  );
};

export default PlaylistView;
