"use client";

import { UnifiedProvider } from "@/context/UnifiedContext";
import Header from "../components/Header";
import UnifiedSearch from "../components/UnifiedSearch";
import UnifiedPlayer from "../components/UnifiedPlayer";
import UnifiedPlaylistView from "../components/UnifiedPlaylistView";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { useEffect, useState, useCallback } from "react";
import { configureWebGL } from "../utils/webglConfig";
import { ServiceType, Song } from "@/types/playerTypes";
import { getYouTubeVideos } from "../components/Services/YtService";
import UnifiedPlaylistLibrary from "@/app/components/UnifiedPlaylistLibrary";

interface SpotifyImage {
  url: string;
  width: number;
  height: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    images: SpotifyImage[];
  };
}

function ReAMPContent() {
  const { youtube, spotify } = useUnifiedContext();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [spotifyNextPageToken, setSpotifyNextPageToken] = useState<
    string | null
  >(null);

  useEffect(() => {
    configureWebGL();
  }, []);

  // Add the animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 10px rgba(255,107,107,0.6), 0 0 20px rgba(78,205,196,0.4);
        }
        50% {
          box-shadow: 0 0 30px rgba(255,107,107,0.8), 0 0 50px rgba(78,205,196,0.6);
        }
      }
      .animate-glow {
        animation: glow 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleSearch = useCallback(
    async (query: string, service: ServiceType) => {
      if (service === ServiceType.Youtube) {
        const { items, nextPageToken } = await getYouTubeVideos(query);
        youtube.setSearchResults(items);
        youtube.setNextPageToken(nextPageToken);
        youtube.setCurrentSearchTerm(query);
      } else {
        try {
          const response = await fetch(
            `/api/spotify/search?q=${encodeURIComponent(query)}`
          );
          if (!response.ok) throw new Error("Failed to fetch search results");
          const data = await response.json();

          // Map Spotify tracks to Song type
          const mappedResults: Song[] = data.tracks.items.map(
            (track: SpotifyTrack) => {
              const images = track.album.images || [];
              const smallImage = images.find(
                (img: SpotifyImage) => img.width <= 64
              ) ||
                images[images.length - 1] || { url: "", width: 64, height: 64 };
              const mediumImage = images.find(
                (img: SpotifyImage) => img.width <= 300
              ) ||
                images[images.length - 1] || {
                  url: "",
                  width: 300,
                  height: 300,
                };
              const bigImage = images[0] ||
                images[images.length - 1] || {
                  url: "",
                  width: 640,
                  height: 640,
                };

              return {
                id: track.id,
                type: ServiceType.Spotify,
                title: track.name,
                artist: {
                  id: track.artists[0]?.id || "",
                  name: track.artists[0]?.name || "Unknown Artist",
                },
                artwork: {
                  small: {
                    url: smallImage.url || "",
                    width: smallImage.width || 64,
                    height: smallImage.height || 64,
                  },
                  medium: {
                    url: mediumImage.url || "",
                    width: mediumImage.width || 300,
                    height: mediumImage.height || 300,
                  },
                  big: {
                    url: bigImage.url || "",
                    width: bigImage.width || 640,
                    height: bigImage.height || 640,
                  },
                },
              };
            }
          );

          spotify.setSearchResults(mappedResults);
          setSpotifyNextPageToken(
            data.tracks.next
              ? String(data.tracks.offset + data.tracks.items.length)
              : null
          );
        } catch (error) {
          console.error("Error searching Spotify:", error);
          spotify.setSearchResults([]);
          setSpotifyNextPageToken(null);
        }
      }
    },
    [youtube, spotify]
  );

  const handleLoadMore = useCallback(
    async (service: ServiceType) => {
      if (service === ServiceType.Youtube) {
        if (youtube.nextPageToken && youtube.currentSearchTerm) {
          const { items, nextPageToken } = await getYouTubeVideos(
            youtube.currentSearchTerm,
            youtube.nextPageToken
          );
          youtube.setSearchResults([...youtube.searchResults, ...items]);
          youtube.setNextPageToken(nextPageToken);
        }
      } else {
        if (spotifyNextPageToken && !isLoadingMore) {
          setIsLoadingMore(true);
          try {
            const response = await fetch(
              `/api/spotify/search?q=${encodeURIComponent(
                youtube.currentSearchTerm
              )}&offset=${spotifyNextPageToken}`
            );
            if (!response.ok) throw new Error("Failed to fetch more results");
            const data = await response.json();

            // Map additional Spotify tracks to Song type
            const mappedResults: Song[] = data.tracks.items.map(
              (track: SpotifyTrack) => {
                const images = track.album.images || [];
                const smallImage = images.find(
                  (img: SpotifyImage) => img.width <= 64
                ) ||
                  images[images.length - 1] || {
                    url: "",
                    width: 64,
                    height: 64,
                  };
                const mediumImage = images.find(
                  (img: SpotifyImage) => img.width <= 300
                ) ||
                  images[images.length - 1] || {
                    url: "",
                    width: 300,
                    height: 300,
                  };
                const bigImage = images[0] ||
                  images[images.length - 1] || {
                    url: "",
                    width: 640,
                    height: 640,
                  };

                return {
                  id: track.id,
                  type: ServiceType.Spotify,
                  title: track.name,
                  artist: {
                    id: track.artists[0]?.id || "",
                    name: track.artists[0]?.name || "Unknown Artist",
                  },
                  artwork: {
                    small: {
                      url: smallImage.url || "",
                      width: smallImage.width || 64,
                      height: smallImage.height || 64,
                    },
                    medium: {
                      url: mediumImage.url || "",
                      width: mediumImage.width || 300,
                      height: mediumImage.height || 300,
                    },
                    big: {
                      url: bigImage.url || "",
                      width: bigImage.width || 640,
                      height: bigImage.height || 640,
                    },
                  },
                };
              }
            );

            spotify.setSearchResults([
              ...spotify.searchResults,
              ...mappedResults,
            ]);
            setSpotifyNextPageToken(
              data.tracks.next
                ? String(data.tracks.offset + data.tracks.items.length)
                : null
            );
          } catch (error) {
            console.error("Error loading more Spotify results:", error);
          } finally {
            setIsLoadingMore(false);
          }
        }
      }
    },
    [youtube, spotify, spotifyNextPageToken, isLoadingMore]
  );

  return (
    <div className="h-screen bg-[#0A0A0A] text-gray-100 flex flex-col overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

      <Header
        title="ReAMP"
        searchComponent={
          <UnifiedSearch
            onSearch={handleSearch}
            onLoadMore={handleLoadMore}
            hasMore={!!(youtube.nextPageToken || spotifyNextPageToken)}
            isLoadingMore={isLoadingMore}
            spotifyNextPageToken={spotifyNextPageToken}
          />
        }
      />

      {/* Main Content */}
      <main className="flex-1 w-full p-6 relative z-10 overflow-hidden">
        {/* Main Layout Container - Responsive */}
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Library Section - Vertical in desktop, Horizontal in tablet/mobile */}
          <div className="flex flex-row lg:flex-col">
            <div className="bg-black/20 rounded-lg p-4 h-full flex flex-col">
              <UnifiedPlaylistLibrary
                theme={{
                  primary: "#FF6B6B",
                  secondary: "#4ECDC4",
                  accent: "#FFE66D",
                }}
              />
            </div>
          </div>

          {/* Content Section - Playlist and Player */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Playlist Section - Always visible in desktop mode */}
            <div className="w-full lg:w-1/3 bg-black/20 rounded-lg overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4">
                  <UnifiedPlaylistView />
                </div>
              </div>
            </div>

            {/* Player Section - Full width in portrait mode */}
            <div className="w-full lg:w-2/3 bg-black rounded-lg overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
              {/* Container that adapts based on active service */}
              <div className="flex-1 relative min-h-[500px] lg:min-h-0">
                <UnifiedPlayer />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Add custom scrollbar styles
const style = document.createElement("style");
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #FF6B6B;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 107, 107, 0.8);
  }
`;
document.head.appendChild(style);

export default function ReAMPPage() {
  return (
    <UnifiedProvider>
      <ReAMPContent />
    </UnifiedProvider>
  );
}
