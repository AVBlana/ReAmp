import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";
import { Song } from "@/types/playerTypes";
import { useSpotify } from "@/context/UnifiedContext";

interface SpotifySongItemProps {
  song: Song;
  variant?: "compact" | "full";
  onPlay?: (song: Song) => void;
}

export default function SpotifySongItem({
  song,
  variant = "full",
  onPlay,
}: SpotifySongItemProps) {
  const { playlist, addToPlaylist } = useSpotify();
  const isInPlaylist = playlist.some((track) => track && track.id === song.id);

  const handlePlay = () => {
    if (onPlay) {
      onPlay(song);
    }
  };

  const handleAddToPlaylist = () => {
    addToPlaylist(song);
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1DB954]/10 transition-colors duration-200 group">
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image
            src={song.artwork.small.url}
            alt={song.title}
            width={song.artwork.small.width}
            height={song.artwork.small.height}
            className="rounded-md"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <FaPlay className="text-white text-lg" onClick={handlePlay} />
          </div>
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-sm font-medium text-white truncate">
            {song.title}
          </h3>
          <p className="text-xs text-gray-400 truncate">{song.artist.name}</p>
        </div>
        <button
          onClick={handleAddToPlaylist}
          className={`p-2 rounded-full transition-all duration-300 ${
            isInPlaylist
              ? "bg-gray-400/20 cursor-not-allowed text-gray-400"
              : "bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white hover:scale-105 shadow-lg hover:shadow-[#FF6B6B]/20 group-hover:animate-pulse"
          }`}
          title={isInPlaylist ? "Already in playlist" : "Add to playlist"}
          disabled={isInPlaylist}
        >
          <FaPlus size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex border border-[#1DB954]/20 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#1DB954]/5 to-transparent hover:from-[#1DB954]/10 group">
      <div className="w-48 flex-shrink-0 relative group">
        <Image
          src={song.artwork.medium.url}
          alt={song.title}
          width={song.artwork.medium.width}
          height={song.artwork.medium.height}
        />
        <div
          className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all duration-300 cursor-pointer"
          onClick={handlePlay}
        >
          <FaPlay
            size={30}
            className="text-white opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
          />
        </div>
      </div>

      <div className="flex-grow p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#1DB954] group-hover:to-[#1DB954]/80 transition-all duration-300">
          {song.title}
        </h3>
        <p className="text-sm text-gray-300 mb-2">{song.artist.name}</p>
      </div>

      <div className="flex items-center p-4">
        <button
          onClick={handleAddToPlaylist}
          className={`p-2 rounded-full transition-all duration-300 ${
            isInPlaylist
              ? "bg-gray-400/20 cursor-not-allowed text-gray-400"
              : "bg-[#FF6B6B] hover:bg-[#FF6B6B]/80 text-white hover:scale-105 shadow-lg hover:shadow-[#FF6B6B]/20 group-hover:animate-pulse"
          }`}
          title={isInPlaylist ? "Already in playlist" : "Add to playlist"}
          disabled={isInPlaylist}
        >
          <FaPlus size={12} />
        </button>
      </div>
    </div>
  );
}
