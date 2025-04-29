import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";
import { YoutubeVideo } from "../Services/YtService";
import { useAppContext } from "@/app/AppContext";
import { Draggable } from "@hello-pangea/dnd";

interface YtSearchResultsListProps {
  searchResults: YoutubeVideo[];
  setSelectedVideo: (videoId: string) => void;
}

export default function YtSearchResultsList({
  searchResults,
  setSelectedVideo,
}: YtSearchResultsListProps) {
  const { handleAddToPlaylist, playlist } = useAppContext();

  return (
    <div className="space-y-4">
      {searchResults.map((video, index) => (
        <Draggable
          key={video.id.videoId}
          draggableId={video.id.videoId}
          index={index}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className={`flex border border-[#FF0000]/20 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#FF0000]/5 to-transparent hover:from-[#FF0000]/10 group ${
                snapshot.isDragging
                  ? "ring-2 ring-[#FF0000] ring-opacity-50 shadow-[0_0_20px_rgba(255,0,0,0.3)]"
                  : ""
              }`}
            >
              <div className="w-48 flex-shrink-0 relative group">
                <Image
                  src={video.snippet.thumbnails.medium.url}
                  width={video.snippet.thumbnails.medium.width}
                  height={video.snippet.thumbnails.medium.height}
                  alt={video.snippet.title}
                  className="object-cover w-full h-full"
                />
                <div
                  className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedVideo(video.id.videoId)}
                >
                  <FaPlay
                    size={30}
                    className="text-white opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between p-4 w-full">
                <div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#FF0000] group-hover:to-[#FF0000]/80 transition-all duration-300">
                    {video.snippet.title}
                  </h3>
                  <p className="text-sm text-gray-300 mb-2">
                    {video.snippet.channelTitle}
                  </p>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {video.snippet.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-4">
                <button
                  onClick={() => handleAddToPlaylist(video)}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    playlist.some(
                      (item) => item.id.videoId === video.id.videoId
                    )
                      ? "bg-gray-400/20 cursor-not-allowed text-gray-400"
                      : "bg-[#FF0000] hover:bg-[#FF0000]/80 text-white hover:scale-105 shadow-lg hover:shadow-[#FF0000]/20 group-hover:animate-pulse"
                  }`}
                  title={
                    playlist.some(
                      (item) => item.id.videoId === video.id.videoId
                    )
                      ? "Already in playlist"
                      : "Add to playlist"
                  }
                  disabled={playlist.some(
                    (item) => item.id.videoId === video.id.videoId
                  )}
                >
                  <FaPlus size={12} />
                </button>
              </div>
            </div>
          )}
        </Draggable>
      ))}
    </div>
  );
}
