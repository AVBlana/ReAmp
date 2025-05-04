import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";
import { Song } from "../../../types/playerTypes";
import { PlayingContext } from "../../../context/Playing";
import { useContext } from "react";

interface SpotifySearchResultsListProps {
  searchResults: Song[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export default function SpotifySearchResultsList({
  searchResults,
  onLoadMore,
  hasMore,
}: SpotifySearchResultsListProps) {
  const { setCurrentSong, playlist, setPlaylist } = useContext(PlayingContext);

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
  };

  const handleAddToPlaylist = (song: Song) => {
    if (!playlist.some((track) => track && track.id === song.id)) {
      setPlaylist([...playlist, song]);
    }
  };

  return (
    <div className="space-y-4">
      {searchResults.map((song) => (
        <div
          key={song.id}
          className="flex border border-[#1DB954]/20 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-[#1DB954]/5 to-transparent hover:from-[#1DB954]/10 group"
        >
          <div className="w-48 flex-shrink-0 relative group">
            <Image
              src={song.artwork.medium.url}
              alt={song.title}
              width={song.artwork.medium.width}
              height={song.artwork.medium.height}
            />
            <div
              className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all duration-300 cursor-pointer"
              onClick={() => handlePlay(song)}
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
              onClick={() => handleAddToPlaylist(song)}
              className={`p-2 rounded-full transition-all duration-300 ${
                playlist.some((track) => track && track.id === song.id)
                  ? "bg-gray-400/20 cursor-not-allowed text-gray-400"
                  : "bg-[#1DB954] hover:bg-[#1DB954]/80 text-white hover:scale-105 shadow-lg hover:shadow-[#1DB954]/20 group-hover:animate-pulse"
              }`}
              title={
                playlist.some((track) => track && track.id === song.id)
                  ? "Already in playlist"
                  : "Add to playlist"
              }
              disabled={playlist.some((track) => track && track.id === song.id)}
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
            className="px-6 py-2 bg-[#1DB954] text-white rounded-full hover:bg-[#1DB954]/80 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-[#1DB954]/20 hover:scale-105 border border-[#1DB954]/20"
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
}
