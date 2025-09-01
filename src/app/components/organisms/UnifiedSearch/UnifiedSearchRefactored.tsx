"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import SearchResultsContainer from "@/app/components/SearchResultsContainer";
import SearchResultItem from "@/app/components/molecules/SearchResultItem";

type SearchResult = YoutubeVideo | Song;

interface UnifiedSearchRefactoredProps {
  onSearch: (query: string, service: ServiceType) => void;
  onLoadMore?: (service: ServiceType) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  spotifyNextPageToken?: string | null;
}

export default function UnifiedSearchRefactored({
  onSearch,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  spotifyNextPageToken = null,
}: UnifiedSearchRefactoredProps) {
  const { youtube, spotify, unified } = useUnifiedContext();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchQueryRef = useRef<string>("");

  // Handle clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (query.trim() && query !== lastSearchQueryRef.current) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for search
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          // Search both services simultaneously
          await Promise.all([
            onSearch(query.trim(), ServiceType.Youtube),
            onSearch(query.trim(), ServiceType.Spotify),
          ]);
          lastSearchQueryRef.current = query.trim();
          setIsOpen(true);
        } finally {
          setIsSearching(false);
        }
      }, 500); // 500ms delay
    }

    // Cleanup timeout on unmount or query change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, onSearch]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isSearching) return;

    setIsSearching(true);
    try {
      if (youtube.nextPageToken) {
        await onLoadMore?.(ServiceType.Youtube);
      }
      if (spotifyNextPageToken) {
        await onLoadMore?.(ServiceType.Spotify);
      }
    } finally {
      setIsSearching(false);
    }
  }, [
    youtube.nextPageToken,
    spotifyNextPageToken,
    onLoadMore,
    isLoadingMore,
    isSearching,
  ]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // The search will be handled by the useEffect above
  }, []);

  const handleAddToPlaylist = useCallback(
    (result: SearchResult, service: ServiceType) => {
      if (service === ServiceType.Youtube) {
        const video = result as YoutubeVideo;
        // Add to unified playlist
        unified.addToPlaylist({
          id: video.id.videoId,
          type: ServiceType.Youtube,
          data: video,
        });
      } else if (service === ServiceType.Spotify) {
        const song = result as Song;
        // Add to unified playlist
        unified.addToPlaylist({
          id: song.id,
          type: ServiceType.Spotify,
          data: song,
        });
      }
    },
    [unified]
  );

  // Combine and sort results from both services with null checks and deduplication
  const combinedResults = [
    ...(youtube.searchResults || []),
    ...(spotify.searchResults || []),
  ]
    .filter((result): result is SearchResult => !!result)
    // Deduplicate results based on their unique identifiers
    .filter((result, index, self) => {
      const resultId = getResultId(result);
      const serviceType = getServiceType(result);
      const uniqueKey = `${serviceType}-${resultId}`;
      return (
        index ===
        self.findIndex(
          (r) => `${getServiceType(r)}-${getResultId(r)}` === uniqueKey
        )
      );
    })
    .sort((a, b) => {
      const titleA = getTitle(a).toLowerCase();
      const titleB = getTitle(b).toLowerCase();
      return titleA.localeCompare(titleB);
    });

  // Helper functions
  const isYoutubeVideo = (result: SearchResult): result is YoutubeVideo => {
    return "snippet" in result && "id" in result && "videoId" in result.id;
  };

  const isSpotifySong = (result: SearchResult): result is Song => {
    return (
      "title" in result &&
      "id" in result &&
      "type" in result &&
      result.type === ServiceType.Spotify
    );
  };

  const getTitle = (result: SearchResult): string => {
    if (!result) return "Unknown Title";

    if (isYoutubeVideo(result)) {
      return result.snippet?.title || "Unknown Title";
    }

    if (isSpotifySong(result)) {
      return result.title || "Unknown Title";
    }

    return "Unknown Title";
  };

  const getResultId = (result: SearchResult): string => {
    if (!result) return "";

    if (isYoutubeVideo(result)) {
      return result.id?.videoId || "";
    }

    if (isSpotifySong(result)) {
      return result.id || "";
    }

    return "";
  };

  const getServiceType = (result: SearchResult): ServiceType => {
    if (!result) return ServiceType.Youtube;
    if (isYoutubeVideo(result)) return ServiceType.Youtube;
    if (isSpotifySong(result)) return ServiceType.Spotify;
    return ServiceType.Youtube;
  };

  // Generate a unique key for each result
  const getUniqueKey = (result: SearchResult): string => {
    const resultId = getResultId(result);
    const serviceType = getServiceType(result);
    const timestamp = Date.now(); // Add timestamp to ensure uniqueness
    return `${serviceType}-${resultId}-${timestamp}`;
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          {/* Search Input */}
          <input
            type="text"
            id="unified-search-input"
            name="unified-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for songs..."
            className="w-full bg-black/20 text-white placeholder-gray-400 rounded-lg pl-4 pr-4 py-2 border-2 border-[#FF6B6B] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:bg-black/30 transition-all duration-200"
            autoComplete="off"
          />

          {/* Search Button - Now just for visual purposes */}
          <button
            type="submit"
            className="absolute right-2 p-2 text-gray-400 hover:text-white transition-colors"
            aria-label="Search"
          >
            <FaSearch size={16} />
          </button>
        </div>
      </form>

      {/* Search Results */}
      <SearchResultsContainer
        isOpen={isOpen && combinedResults.length > 0}
        theme={{
          primary: "#1DB954",
          secondary: "#1ed760",
        }}
        hasMore={hasMore && !isSearching}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore || isSearching}
      >
        {combinedResults.map((result) => {
          const resultId = getResultId(result);
          const serviceType = getServiceType(result);
          const isInPlaylist = unified.playlist.some((item) => {
            if (serviceType === ServiceType.Youtube) {
              return item.id === resultId && item.type === ServiceType.Youtube;
            } else {
              return item.id === resultId && item.type === ServiceType.Spotify;
            }
          });

          // Map result data to SearchResultItem props
          const title = getTitle(result);
          const subtitle = isYoutubeVideo(result) 
            ? result.snippet?.channelTitle || "Unknown Channel"
            : result.artist || "Unknown Artist";
          const thumbnail = isYoutubeVideo(result)
            ? result.snippet?.thumbnails?.medium?.url || result.snippet?.thumbnails?.default?.url || ""
            : result.albumArt || "";
          const service = isYoutubeVideo(result) ? "youtube" : "spotify";

          return (
            <SearchResultItem
              key={getUniqueKey(result)}
              title={title}
              subtitle={subtitle}
              thumbnail={thumbnail}
              service={service}
              onAddToPlaylist={() => handleAddToPlaylist(result, serviceType)}
              isInPlaylist={isInPlaylist}
            />
          );
        })}
      </SearchResultsContainer>
    </div>
  );
}
