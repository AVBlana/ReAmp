"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { FaYoutube, FaSpotify, FaSearch, FaPlus } from "react-icons/fa";
import SearchResultsContainer from "../SearchResultsContainer";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { ServiceType, Song } from "@/types/playerTypes";
import { YoutubeVideo } from "@/app/components/Services/YtService";

type SearchResult = YoutubeVideo | Song;

interface UnifiedSearchProps {
  onSearch: (query: string, service: ServiceType) => void;
  onLoadMore?: (service: ServiceType) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  spotifyNextPageToken?: string | null;
}

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

const getSubtitle = (result: SearchResult): string => {
  if (!result) return "Unknown Artist";

  if (isYoutubeVideo(result)) {
    return result.snippet?.channelTitle || "Unknown Channel";
  }

  if (isSpotifySong(result)) {
    return result.artist?.name || "Unknown Artist";
  }

  return "Unknown Artist";
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

const getThumbnailUrl = (result: SearchResult): string => {
  if (!result) return "";

  if (isYoutubeVideo(result)) {
    return result.snippet?.thumbnails?.default?.url || "";
  }

  if (isSpotifySong(result)) {
    return (
      result.artwork?.small?.url ||
      result.artwork?.medium?.url ||
      result.artwork?.big?.url ||
      ""
    );
  }

  return "";
};

export default function UnifiedSearch({
  onSearch,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  spotifyNextPageToken = null,
}: UnifiedSearchProps) {
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
      } else if (service === ServiceType.Spotify && isSpotifySong(result)) {
        // Add to unified playlist
        unified.addToPlaylist({
          id: result.id,
          type: ServiceType.Spotify,
          data: result,
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
          const isYoutube = serviceType === ServiceType.Youtube;
          const isInPlaylist = unified.playlist.some((item) => {
            if (serviceType === ServiceType.Youtube) {
              return item.id === resultId && item.type === ServiceType.Youtube;
            } else {
              return item.id === resultId && item.type === ServiceType.Spotify;
            }
          });

          return (
            <div
              key={getUniqueKey(result)}
              className="flex items-center space-x-4 p-3 hover:bg-white/5 transition-colors cursor-pointer group"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "text/plain",
                  `${serviceType}-${resultId}`
                );
              }}
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden relative">
                <img
                  src={getThumbnailUrl(result)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToPlaylist(result, serviceType);
                    }}
                    disabled={isInPlaylist}
                    className={`p-1.5 rounded-full ${
                      isInPlaylist
                        ? "bg-gray-500 cursor-not-allowed"
                        : isYoutube
                        ? "bg-[#FF0000] hover:bg-[#FF0000]/80"
                        : "bg-[#1DB954] hover:bg-[#1DB954]/80"
                    } transition-colors`}
                    title={
                      isInPlaylist ? "Already in playlist" : "Add to playlist"
                    }
                  >
                    <FaPlus className="text-white" size={12} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <h3 className="text-sm font-medium text-white truncate">
                  {getTitle(result)}
                </h3>
                <p className="text-xs text-gray-400 truncate">
                  {getSubtitle(result)}
                </p>
              </div>

              {/* Service Icon */}
              <div className="flex-shrink-0">
                {isYoutube ? (
                  <FaYoutube className="text-[#FF0000]" size={16} />
                ) : (
                  <FaSpotify className="text-[#1DB954]" size={16} />
                )}
              </div>
            </div>
          );
        })}
      </SearchResultsContainer>
    </div>
  );
}
