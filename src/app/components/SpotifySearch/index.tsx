"use client";

import { useState, useEffect, useRef } from "react";
import { useSpotify } from "@/context/UnifiedContext";
import { ServiceType } from "@/types/playerTypes";
import SpotifySongItem from "../SpotifySongItem";
import SearchResultsContainer from "../SearchResultsContainer";

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
  const { searchResults, setSearchResults, setCurrentSong } = useSpotify();
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
      <SearchResultsContainer
        isOpen={isDropdownOpen && searchResults.length > 0}
        theme={{
          primary: "#1DB954",
          secondary: "#1DB954",
        }}
      >
        {searchResults.map((song) => (
          <SpotifySongItem
            key={song.id}
            song={song}
            variant="compact"
            onPlay={setCurrentSong}
          />
        ))}
      </SearchResultsContainer>
    </div>
  );
}
