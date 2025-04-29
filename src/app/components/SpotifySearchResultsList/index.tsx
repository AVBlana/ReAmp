import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";
import { Song } from "../../../types/playerTypes";
import { usePlaying } from "../../../context/Playing";

interface SpotifySearchResultsListProps {
  searchResults: Song[];
}

export default function SpotifySearchResultsList({
  searchResults,
}: SpotifySearchResultsListProps) {
  const { setCurrentSong, playlist, setPlaylist } = usePlaying();

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
  };

  const handleAddToPlaylist = (song: Song) => {
    // Check if the song is already in the playlist
    const isAlreadyInPlaylist = playlist.some(
      (track) => track && track.id === song.id
    );

    if (!isAlreadyInPlaylist) {
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
              width={song.artwork.medium.width}
              height={song.artwork.medium.height}
              alt={song.title}
              className="object-cover w-full h-full"
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

          <div className="flex flex-col justify-between p-4 w-full">
            <div>
              <h3 className="font-bold text-lg mb-2 line-clamp-2 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#1DB954] group-hover:to-[#1DB954]/80 transition-all duration-300">
                {song.title}
              </h3>
              <p className="text-sm text-gray-300">{song.artist.name}</p>
            </div>
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
    </div>
  );
}
