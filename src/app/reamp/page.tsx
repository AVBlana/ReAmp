"use client";

import { UnifiedProvider } from "@/app/context/UnifiedContext";
import Header from "@/app/components/organisms/Header";
import DJSetPlayerV2 from "@/app/components/organisms/DJSetPlayer/DJSetPlayerV2";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { useState, useCallback, useEffect } from "react";
import { ServiceType } from "@/app/types/playerTypes";
import { getYouTubeVideos } from "@/app/components/Services/YtService";
import { searchSpotify } from "@/app/components/Services/SpotifyService";
import { useAuth } from "@/app/context/AuthContext";
import { useConnectedServices } from "@/app/hooks/useConnectedServices";

import UnifiedSearch from "@/app/components/organisms/UnifiedSearch";
import UnifiedPlaylistLibrary from "@/app/components/organisms/UnifiedPlaylistLibrary";
import UnifiedPlaylistView from "@/app/components/organisms/UnifiedPlaylistView";
import { motion } from "framer-motion";
import { YouTubeFooter } from "@/app/components/organisms/Footer";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

function ReAMPContent() {
  const { youtube, spotify } = useUnifiedContext();
  const { signOut, isAuthenticated } = useAuth();
  const { spotify: spotifyConnected } = useConnectedServices();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [spotifyNextPageToken, setSpotifyNextPageToken] = useState<
    string | null
  >(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [isAuthenticated]);

  const handleSearch = useCallback(
    async (
      query: string,
      service: ServiceType,
      isCurrentSearch?: () => boolean
    ) => {
      if (service === ServiceType.Youtube) {
        const { items, nextPageToken } = await getYouTubeVideos(query);
        if (isCurrentSearch && !isCurrentSearch()) return;
        youtube.setSearchResults(items);
        youtube.setNextPageToken(nextPageToken);
        youtube.setCurrentSearchTerm(query);
      } else if (service === ServiceType.Spotify) {
        if (!spotifyConnected) {
          if (isCurrentSearch && !isCurrentSearch()) return;
          spotify.setSearchResults([]);
          setSpotifyNextPageToken(null);
          return;
        }
        try {
          const { items, nextPageToken } = await searchSpotify(query);
          if (isCurrentSearch && !isCurrentSearch()) return;
          spotify.setSearchResults(items);
          setSpotifyNextPageToken(nextPageToken);
          youtube.setCurrentSearchTerm(query);
        } catch (error) {
          console.error("Error searching Spotify:", error);
          if (isCurrentSearch && !isCurrentSearch()) return;

          if (
            error instanceof Error &&
            error.message.includes("authentication")
          ) {
            console.log("Spotify authentication failed, but staying on page");
            spotify.setSearchResults([]);
            setSpotifyNextPageToken(null);
            return;
          }

          if (
            error instanceof Error &&
            error.message.includes("Spotify not connected")
          ) {
            console.log(
              "Spotify not connected - user needs to connect Spotify account"
            );
            spotify.setSearchResults([]);
            setSpotifyNextPageToken(null);
            return;
          }

          spotify.setSearchResults([]);
          setSpotifyNextPageToken(null);
        }
      }
    },
    [youtube, spotify, spotifyConnected]
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
            // Token is now handled by NextAuth automatically

            // Use the new NextAuth-protected Spotify service with offset
            const { items, nextPageToken } = await searchSpotify(
              youtube.currentSearchTerm || "",
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
    <div className="min-h-screen lg:h-screen bg-[#0A0A0A] text-gray-100 flex flex-col overflow-x-hidden overflow-y-auto lg:overflow-hidden">
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
        onLogout={signOut}
        showLogout={isAuthenticated}
      />

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0 p-6 relative z-10 overflow-x-hidden lg:overflow-hidden">
        {/* Main Layout Container - Responsive */}
        <div className="flex flex-col lg:flex-row gap-6 min-h-full lg:h-full min-w-0">
          {/* Library Section - Vertical on desktop, two-row on mobile; constrained to prevent horizontal scroll */}
          <div className="flex-shrink-0 lg:flex-shrink-0 w-full lg:w-auto min-w-0 max-w-full">
            <motion.div className="bg-black/20 rounded-lg p-4 flex flex-col min-h-0 max-h-full min-w-0 overflow-hidden">
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
          <div className="flex-1 min-w-0 flex flex-col lg:flex-row gap-6 min-h-0">
            {/* Playlist Section - Smaller in portrait mode, normal in desktop */}
            <div className="w-full lg:w-1/3 bg-black/20 rounded-lg overflow-hidden flex flex-col min-h-[200px] lg:min-h-0 max-h-[40vh] lg:max-h-none">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-4">
                  <UnifiedPlaylistView />
                </div>
              </div>
            </div>

            {/* DJ Set Player Section - Full width in portrait mode */}
            <div className="w-full lg:w-2/3 rounded-lg overflow-visible lg:overflow-hidden flex flex-col min-h-[800px] lg:min-h-0">
              {/* Container that adapts based on active service */}
              <div className="flex-1 relative min-h-[800px] lg:min-h-0">
                <DJSetPlayerV2 userName={userProfile?.name} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <YouTubeFooter />
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
