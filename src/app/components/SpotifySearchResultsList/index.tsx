"use client";

import { Song } from "@/types/playerTypes";
import { useSpotify } from "@/context/UnifiedContext";
import SpotifySongItem from "../SpotifySongItem";

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
  const { setCurrentSong } = useSpotify();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <span className="bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 bg-clip-text text-transparent">
          Search Results
        </span>
        {searchResults.length > 0 && (
          <span className="ml-3 text-sm text-gray-400">
            ({searchResults.length} tracks)
          </span>
        )}
      </h2>
      {searchResults.map((song) => (
        <SpotifySongItem
          key={song.id}
          song={song}
          variant="full"
          onPlay={setCurrentSong}
        />
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
