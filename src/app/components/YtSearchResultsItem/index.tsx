import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";
import { YoutubeVideo } from "../Services/YtService";
import { useYoutube } from "@/context/UnifiedContext";

interface YtSearchResultsItemProps {
  video: YoutubeVideo;
  onPlay: (videoId: string) => void;
}

export default function YtSearchResultsItem({
  video,
  onPlay,
}: YtSearchResultsItemProps) {
  const { addToPlaylist, playlist } = useYoutube();

  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    addToPlaylist(video);
  };

  const isInPlaylist = playlist.some(
    (item) => item.id.videoId === video.id.videoId
  );

  return (
    <div
      className="flex items-center gap-3 p-2 hover:bg-[#FF0000]/5 rounded-lg transition-colors duration-200 cursor-pointer group"
      onClick={() => onPlay(video.id.videoId)}
    >
      <div className="relative w-12 h-12 flex-shrink-0">
        <Image
          src={video.snippet.thumbnails.default.url}
          alt={video.snippet.title}
          width={48}
          height={48}
          className="rounded-md object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-md">
          <FaPlay className="text-white text-sm" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-white truncate group-hover:text-[#FF0000] transition-colors duration-200">
          {video.snippet.title}
        </h3>
        <p className="text-xs text-gray-400 truncate">
          {video.snippet.channelTitle}
        </p>
      </div>
      <button
        onClick={handleAddToPlaylist}
        disabled={isInPlaylist}
        className={`p-2 rounded-full transition-all duration-300 ${
          isInPlaylist
            ? "bg-gray-400/20 cursor-not-allowed text-gray-400"
            : "bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white hover:scale-105 shadow-lg hover:shadow-[#FF6B6B]/20 group-hover:animate-pulse"
        }`}
        title={isInPlaylist ? "Already in playlist" : "Add to playlist"}
      >
        <FaPlus size={12} />
      </button>
    </div>
  );
}
