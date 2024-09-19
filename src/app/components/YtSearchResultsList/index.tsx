import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";
import { YoutubeVideo } from "../Services/YtService";
import { useAppContext } from "@/app/AppContext";

interface YtSearchResultsListProps {
  searchResults: YoutubeVideo[];
  setSelectedVideo: (videoId: string) => void;
}

export default function YtSearchResultsList({
  searchResults,
  setSelectedVideo,
}: YtSearchResultsListProps) {
  const { handleAddToPlaylist } = useAppContext();
  return (
    <div className="space-y-4">
      {searchResults.map((video) => (
        <div
          key={video.id.videoId}
          className="flex border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
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
              <h3 className="font-bold text-lg mb-2 line-clamp-2">
                {video.snippet.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {video.snippet.channelTitle}
              </p>
              <p className="text-sm text-gray-500 line-clamp-2">
                {video.snippet.description}
              </p>
            </div>
          </div>
          <div className="flex items-center p-4">
            <button
              onClick={() => handleAddToPlaylist(video)}
              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors duration-300"
              title="Add to playlist"
            >
              <FaPlus size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
