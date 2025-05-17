"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSpotify } from "@/context/UnifiedContext";
import SpotifySongItem from "../SpotifySongItem";
import SearchResultsContainer from "../SearchResultsContainer";

interface SpotifySearchProps {
  onSearch: (query: string) => void;
}

const DEBOUNCE_DELAY = 800; // Increased from 500ms to 800ms
const MIN_SEARCH_LENGTH = 3;

export default function SpotifySearch({ onSearch }: SpotifySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { searchResults, setCurrentSong } = useSpotify();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Only search if query meets minimum length and is different from last search
      if (
        query.length >= MIN_SEARCH_LENGTH &&
        query !== lastSearchRef.current
      ) {
        timeoutRef.current = setTimeout(() => {
          onSearch(query);
          lastSearchRef.current = query;
          setIsDropdownOpen(true);
        }, DEBOUNCE_DELAY);
      } else if (query.length < MIN_SEARCH_LENGTH) {
        // Clear results if query is too short
        onSearch("");
        setIsDropdownOpen(false);
      }
    },
    [onSearch]
  );

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value.trim();
    setSearchQuery(newQuery);
    debouncedSearch(newQuery);
  };

  // Handle manual search button click
  const handleSearchClick = () => {
    if (searchQuery.length >= MIN_SEARCH_LENGTH) {
      // Clear any pending debounce
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onSearch(searchQuery);
      lastSearchRef.current = searchQuery;
      setIsDropdownOpen(true);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle click outside
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

  // Add debug logging for render
  console.log("SpotifySearch render state:", {
    searchQuery,
    searchResultsLength: searchResults.length,
    isDropdownOpen,
    lastSearch: lastSearchRef.current,
  });

  return (
    <div className="relative" ref={searchContainerRef}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
            className="flex-grow bg-[#1A1A1A] border border-[#1DB954]/20 text-white rounded-l px-4 py-2 focus:outline-none focus:border-[#1DB954] focus:ring-0 placeholder-gray-400"
            placeholder={`Search for songs (min. ${MIN_SEARCH_LENGTH} characters)`}
          />
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={searchQuery.length < MIN_SEARCH_LENGTH}
            className="bg-[#1DB954] text-white px-6 py-2 rounded-r hover:bg-[#1DB954]/80 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
        hasMore={false}
        onLoadMore={() => {}}
        isLoadingMore={false}
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
