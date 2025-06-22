import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";
import { YoutubeVideo } from "../Services/YtService";
import { useYoutube } from "@/context/UnifiedContext";

interface YtSearchResultsListProps {
  results: YoutubeVideo[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const YtSearchResultsList: React.FC<YtSearchResultsListProps> = ({
  results,
  onLoadMore,
  hasMore,
}: YtSearchResultsListProps) => {
  const { addToPlaylist, playlist, setSelectedVideo } = useYoutube();

  const handleAddToPlaylist = (video: YoutubeVideo) => {
    // Check if the video is already in the playlist
    const isAlreadyInPlaylist = playlist.some(
      (item: YoutubeVideo) => item.id.videoId === video.id.videoId
    );

    if (!isAlreadyInPlaylist) {
      addToPlaylist(video);
    }
  };

  return (
    <div className="space-y-4">
      {results.map((video) => (
        <div
          key={video.id.videoId}
          className="flex border border-[#FF0000]/20 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#FF0000]/5 to-transparent hover:from-[#FF0000]/10 group"
        >
          <div className="relative w-[320px] h-[180px] flex-shrink-0">
            <Image
              src={video.snippet.thumbnails.medium.url}
              width={video.snippet.thumbnails.medium.width || 320}
              height={video.snippet.thumbnails.medium.height || 180}
              alt={video.snippet.title}
              className="object-cover w-full h-full"
              priority={results.indexOf(video) === 0}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = video.snippet.thumbnails.default.url;
              }}
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
                  (item: YoutubeVideo) => item.id.videoId === video.id.videoId
                )
                  ? "bg-gray-400/20 cursor-not-allowed text-gray-400"
                  : "bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white hover:scale-105 shadow-lg hover:shadow-[#FF6B6B]/20 group-hover:animate-pulse"
              }`}
              title={
                playlist.some(
                  (item: YoutubeVideo) => item.id.videoId === video.id.videoId
                )
                  ? "Already in playlist"
                  : "Add to playlist"
              }
              disabled={playlist.some(
                (item: YoutubeVideo) => item.id.videoId === video.id.videoId
              )}
            >
              <FaPlus size={12} />
            </button>
          </div>
        </div>
      ))}

      {hasMore && onLoadMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-[#FF6B6B] text-white rounded-full hover:bg-[#FF6B6B]/80 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-[#FF6B6B]/20 hover:scale-105 border border-[#FF6B6B]/20"
          >
            <span>Load More</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default YtSearchResultsList;
