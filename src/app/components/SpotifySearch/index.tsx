"use client";

import { useState, useEffect, useRef } from "react";
import { useSpotify } from "@/context/UnifiedContext";
import { ServiceType, Song } from "@/types/playerTypes";
import Image from "next/image";
import { FaPlay, FaPlus } from "react-icons/fa";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    images: Array<{ url: string; width: number; height: number }>;
  };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

export default function SpotifySearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { playlist, addToPlaylist, searchResults, setSearchResults } =
    useSpotify();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchQuery.length >= 3 && searchQuery !== lastSearchRef.current) {
      timeoutRef.current = setTimeout(() => {
        handleSearch(searchQuery);
        lastSearchRef.current = searchQuery;
        setIsDropdownOpen(true);
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error("Failed to fetch search results");
      const data = (await response.json()) as SpotifySearchResponse;

      const mappedResults = data.tracks.items.map((track) => ({
        id: track.id,
        title: track.name,
        artist: {
          id: track.artists[0].id,
          name: track.artists[0].name,
        },
        artwork: {
          small: {
            url: track.album.images[2]?.url || track.album.images[0]?.url,
            width: track.album.images[2]?.width || track.album.images[0]?.width,
            height:
              track.album.images[2]?.height || track.album.images[0]?.height,
          },
          medium: {
            url: track.album.images[1]?.url || track.album.images[0]?.url,
            width: track.album.images[1]?.width || track.album.images[0]?.width,
            height:
              track.album.images[1]?.height || track.album.images[0]?.height,
          },
          big: {
            url: track.album.images[0]?.url,
            width: track.album.images[0]?.width,
            height: track.album.images[0]?.height,
          },
        },
        type: ServiceType.Spotify,
      }));

      setSearchResults(mappedResults);
    } catch (error) {
      console.error("Error searching Spotify:", error);
      setSearchResults([]);
    }
  };

  const handleAddToPlaylist = (song: Song) => {
    addToPlaylist(song);
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
            className="flex-grow bg-[#1A1A1A] border border-[#1DB954]/20 text-white rounded-l px-4 py-2 focus:outline-none focus:border-[#1DB954] focus:ring-0 placeholder-gray-400"
            placeholder="Search for songs on Spotify"
          />
          <button
            type="button"
            onClick={() => {
              handleSearch(searchQuery);
              setIsDropdownOpen(true);
            }}
            className="bg-[#1DB954] text-white px-6 py-2 rounded-r hover:bg-[#1DB954]/80 transition-colors duration-300"
          >
            Search
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isDropdownOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#1DB954]/20 rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto spotify-scrollbar">
          <div className="p-2 space-y-2">
            {searchResults.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1DB954]/10 transition-colors duration-200 group"
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src={song.artwork.small.url}
                    alt={song.title}
                    width={song.artwork.small.width}
                    height={song.artwork.small.height}
                    className="rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <FaPlay className="text-white text-lg" />
                  </div>
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {song.title}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {song.artist.name}
                  </p>
                </div>
                <button
                  onClick={() => handleAddToPlaylist(song)}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    playlist.some((item) => item.id === song.id)
                      ? "bg-gray-400/20 cursor-not-allowed text-gray-400"
                      : "bg-[#1DB954] hover:bg-[#1DB954]/80 text-white hover:scale-105 shadow-lg hover:shadow-[#1DB954]/20 group-hover:animate-pulse"
                  }`}
                  title={
                    playlist.some((item) => item.id === song.id)
                      ? "Already in playlist"
                      : "Add to playlist"
                  }
                  disabled={playlist.some((item) => item.id === song.id)}
                >
                  <FaPlus size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
