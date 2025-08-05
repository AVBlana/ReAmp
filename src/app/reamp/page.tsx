"use client";

import { UnifiedProvider } from "@/app/context/UnifiedContext";
import Header from "@/app/components/organisms/Header";
import DJSetPlayer from "@/app/components/organisms/DJSetPlayer";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { useState, useCallback } from "react";
import { ServiceType } from "@/app/types/playerTypes";
import { getYouTubeVideos } from "@/app/components/Services/YtService";
import { searchSpotify } from "@/app/components/Services/SpotifyService";
import SpotifyAuthCheck from "@/app/components/organisms/SpotifyAuthCheck/SpotifyAuthCheck";
import UnifiedSearch from "@/app/components/organisms/UnifiedSearch";
import UnifiedPlaylistLibrary from "@/app/components/organisms/UnifiedPlaylistLibrary";
import UnifiedPlaylistView from "@/app/components/organisms/UnifiedPlaylistView";
import { motion } from "framer-motion";

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
          // Get Spotify token from localStorage
          const token = localStorage.getItem("spotify_token");
          if (!token) {
            console.log("No Spotify token found, redirecting to login...");
            window.location.href = "/api/spotify/login?origin=/reamp";
            return;
          }

          // Use the proper SpotifyService
          const { items, nextPageToken } = await searchSpotify(query, token);
          spotify.setSearchResults(items);
          setSpotifyNextPageToken(nextPageToken);
          youtube.setCurrentSearchTerm(query); // Use youtube for search term tracking
        } catch (error) {
          console.error("Error searching Spotify:", error);

          // Check if it's an authentication error
          if (
            error instanceof Error &&
            error.message.includes("authentication")
          ) {
            console.log(
              "Spotify authentication failed, redirecting to login..."
            );
            window.location.href = "/api/spotify/login?origin=/reamp";
            return;
          }

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
            const token = localStorage.getItem("spotify_token");
            if (!token) {
              console.error("No Spotify token found");
              return;
            }

            // Use the proper SpotifyService with offset
            const { items, nextPageToken } = await searchSpotify(
              youtube.currentSearchTerm || "",
              token,
              spotifyNextPageToken
            );

            spotify.setSearchResults([...spotify.searchResults, ...items]);
            setSpotifyNextPageToken(nextPageToken);
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
