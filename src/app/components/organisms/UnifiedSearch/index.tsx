"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { ServiceType, Song } from "@/app/types/playerTypes";
import SearchResultsContainer from "@/app/components/SearchResultsContainer";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
// Import atomic design components
import SearchBar from "@/app/components/molecules/SearchBar";
import SearchResultItem from "@/app/components/molecules/SearchResultItem";

type SearchResult = YoutubeVideo | Song;

/** Called before applying results; return false to ignore (stale search). */
export type IsCurrentSearch = () => boolean;

interface UnifiedSearchProps {
  onSearch: (
    query: string,
    service: ServiceType,
    isCurrentSearch?: IsCurrentSearch
  ) => void | Promise<void>;
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
  const searchGenerationRef = useRef(0);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Reset last search when query is cleared so next search can run
  useEffect(() => {
    if (!query.trim()) {
      lastSearchQueryRef.current = "";
    }
  }, [query]);

  // Handle clicking outside - only close/clear when click is outside ALL search UIs
  // (Header renders search twice for desktop/mobile; the other instance would otherwise treat + click as "outside" and clear context)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!searchRef.current) return;
      if (searchRef.current.contains(target)) return;

      const el = target as Element;
      if (el?.closest?.("[data-search-root]")) return;

      setIsOpen(false);
      setQuery("");
      youtube.setSearchResults([]);
      spotify.setSearchResults([]);
      lastSearchQueryRef.current = "";
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [youtube, spotify]);

  // Debounced search effect - only depend on query so timeout isn't cleared when parent re-renders
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (trimmed === lastSearchQueryRef.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const generation = ++searchGenerationRef.current;
      const isCurrentSearch = () => searchGenerationRef.current === generation;

      setIsSearching(true);
      try {
        const searchFn = onSearchRef.current;
        await Promise.all([
          searchFn(trimmed, ServiceType.Youtube, isCurrentSearch),
          searchFn(trimmed, ServiceType.Spotify, isCurrentSearch),
        ]);
        if (!isCurrentSearch()) return;
        lastSearchQueryRef.current = trimmed;
        setIsOpen(true);
      } finally {
        if (isCurrentSearch()) setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

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
        const videoId =
          typeof video.id === "string"
            ? video.id
            : video.id?.videoId ?? getResultId(result);
        if (!videoId) return;
        unified.addToPlaylist({
          id: videoId,
          type: ServiceType.Youtube,
          data: video,
        });
      } else if (service === ServiceType.Spotify && isSpotifySong(result)) {
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

  return (
    <div
      className="relative w-full"
      ref={searchRef}
      data-search-root
    >
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          {/* Search Input - Now using SearchBar molecule */}
          <SearchBar
            value={query}
            onSearch={(searchQuery) => {
              setQuery(searchQuery);
              setIsOpen(true);
            }}
            placeholder="Search for songs..."
            debounceMs={500}
            className="w-full"
            loading={isSearching}
            autoFocus={false}
          />
        </div>
      </form>

      {/* Search Results - stop mousedown so clicking plus/add doesn't close dropdown; only click outside closes */}
      <SearchResultsContainer
        isOpen={isOpen && combinedResults.length > 0}
        theme={{
          primary: "#1DB954",
          secondary: "#1ed760",
        }}
        hasMore={hasMore && !isSearching}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore || isSearching}
        onMouseDown={(e) => e.stopPropagation()}
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
              <SearchResultItem
                key={`${serviceType}-${resultId}`}
              title={getTitle(result)}
              subtitle={getSubtitle(result)}
              thumbnail={getThumbnailUrl(result)}
              service={isYoutube ? "youtube" : "spotify"}
              isInPlaylist={isInPlaylist}
              onAddToPlaylist={() => handleAddToPlaylist(result, serviceType)}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData(
                  "text/plain",
                  `${serviceType}|${resultId}`
                );
              }}
            />
          );
        })}
      </SearchResultsContainer>
    </div>
  );
}
