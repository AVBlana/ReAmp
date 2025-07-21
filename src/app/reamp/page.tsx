"use client";

import { UnifiedProvider } from "@/context/UnifiedContext";
import Header from "../components/Header";
import UnifiedSearch from "../components/UnifiedSearch";
import DJSetPlayer from "../components/DJSetPlayer";
import UnifiedPlaylistView from "../components/UnifiedPlaylistView";
import { useUnifiedContext } from "@/context/UnifiedContext";
import { useState, useCallback } from "react";
import { ServiceType, Song } from "@/types/playerTypes";
import { getYouTubeVideos } from "../components/Services/YtService";
import UnifiedPlaylistLibrary from "@/app/components/UnifiedPlaylistLibrary";
import SpotifyAuthCheck from "../components/SpotifyAuthCheck";
import DebugPlayer from "../components/DebugPlayer";

import { motion } from "framer-motion";

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

      <SpotifyAuthCheck />
      <DebugPlayer />

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
            <motion.div className="bg-black/20 rounded-lg p-4 flex flex-col min-h-0 max-h-full">
              <UnifiedPlaylistLibrary
                theme={{
                  primary: "#FF6B6B",
                  secondary: "#4ECDC4",
                  accent: "#FFE66D",
                }}
              />
            </motion.div>
          </div>

          {/* Content Section - Playlist and Player */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Playlist Section - Smaller in portrait mode, normal in desktop */}
            <div className="w-full lg:w-1/3 bg-black/20 rounded-lg overflow-hidden flex flex-col min-h-[200px] lg:min-h-0 max-h-[40vh] lg:max-h-none">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4">
                  <UnifiedPlaylistView />
                </div>
              </div>
            </div>

            {/* DJ Set Player Section - Full width in portrait mode */}
            <div className="w-full lg:w-2/3 rounded-lg overflow-hidden flex flex-col min-h-[800px] lg:min-h-0">
              {/* Container that adapts based on active service */}
              <div className="flex-1 relative min-h-[800px] lg:min-h-0">
                <DJSetPlayer />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ReAMPPage() {
  return (
    <UnifiedProvider>
      <ReAMPContent />
    </UnifiedProvider>
  );
}
