"use client";

import { FaSpotify, FaGoogle } from "react-icons/fa";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { ERROR_MESSAGES, type FriendlyError } from "@/types/auth";

// Import atomic design components
import Button from "@/app/components/atoms/Button";

export default function Home() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [connectedServices, setConnectedServices] = useState<{
    spotify: boolean;
    youtube: boolean;
  }>({ spotify: false, youtube: false });
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth callback and fetch connected services
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    // Handle error messages from OAuth flow
    if (error) {
      const friendlyError = error as FriendlyError;
      const errorInfo =
        ERROR_MESSAGES[friendlyError] || ERROR_MESSAGES["oauth-error"];

      setErrorMessage(errorInfo.message);

      // Auto-hide error after 10 seconds
      setTimeout(() => setErrorMessage(null), 10000);

      // Clean up URL
      router.replace("/", { scroll: false });
    }

    // Retry function for connected-services API
    const fetchConnectedWithRetry = async (retries = 5, delay = 300) => {
      for (let i = 0; i < retries; i++) {
        try {
          console.log(
            `[landing] connected-services attempt ${i + 1}/${retries}`
          );
          const res = await fetch("/api/user/connected-services", {
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          console.log(
            `[landing] connected-services attempt ${i + 1} status:`,
            res.status
          );

          if (res.status === 200) {
            const data = await res.json();
            console.log(
              `[landing] connected-services success on attempt ${i + 1}:`,
              data
            );
            return data;
          }

          if (i < retries - 1) {
            console.log(`[landing] waiting ${delay}ms before retry...`);
            await new Promise((r) => setTimeout(r, delay));
          }
        } catch (error) {
          console.error(
            `[landing] connected-services attempt ${i + 1} error:`,
            error
          );
          if (i < retries - 1) {
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      throw new Error("connected-services unauthorized after retries");
    };

    const fetchServices = async () => {
      try {
        console.log("🔍 Fetching connected services");

        // Use retry logic if we just completed OAuth
        if (connected) {
          console.log(
            `[landing] OAuth callback detected: ${connected}, using retry logic`
          );
          const data = await fetchConnectedWithRetry();
          if (data.success) {
            setConnectedServices(data.connectedServices);
            console.log(
              "✅ Connected services updated:",
              data.connectedServices
            );

            // Show success toast
            if (data.connectedServices[connected]) {
              setShowSuccessToast(connected);
              setTimeout(() => setShowSuccessToast(null), 3000);
            }
          }
        } else {
          // Normal fetch for regular page loads
          const response = await fetch("/api/user/connected-services", {
            credentials: "include",
          });
          const data = await response.json();
          console.log("📊 Connected services response:", data);
          if (data.user && data.user.providers) {
            setConnectedServices(data.user.providers);
            console.log("✅ Connected services updated:", data.user.providers);
          } else {
            console.error("❌ Connected services API failed:", data);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching connected services:", error);
      }
    };

    // Always fetch services (for both authenticated and unauthenticated users)
    fetchServices();

    // Clean up URL if we have a connected param
    if (connected) {
      router.replace("/", { scroll: false });
    }
  }, [isAuthenticated, isLoading, searchParams, router]);

  // Connect handler for OAuth flows
  const handleConnect = async (provider: "spotify" | "google") => {
    setIsConnecting(provider);
    try {
      const callbackUrl = `${window.location.origin}/?connected=${provider}`;
      console.log(`🔗 Connecting ${provider} with callback:`, callbackUrl);
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`❌ Error connecting ${provider}:`, error);
    } finally {
      setIsConnecting(null);
    }
  };

  // Check if at least one service is connected
  const hasConnectedService =
    connectedServices.spotify || connectedServices.youtube;

  // Handle "Drop a beat!" button click
  const handleDropBeat = () => {
    console.log("🎵 Drop a beat clicked!");
    console.log("🔗 Has connected service:", hasConnectedService);
    console.log("📊 Connected services:", connectedServices);
    console.log("🌐 Current URL:", window.location.href);
    console.log("⏰ Timestamp:", new Date().toISOString());

    if (hasConnectedService) {
      console.log("🚀 Redirecting to /reamp");
      // Use direct window location to bypass any router issues
      window.location.href = "/reamp";
      console.log("✅ window.location.href set to /reamp");

      // Add a delay to see if we get redirected back
      setTimeout(() => {
        console.log("🔍 After 1 second, current URL:", window.location.href);
      }, 1000);
    } else {
      console.log("❌ No connected service, cannot redirect");
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-[#0A0A0A]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full overflow-hidden bg-[#0A0A0A]">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center space-y-16">
        {/* Title */}
        <div className="relative">
          <motion.h1
            className="text-8xl md:text-9xl font-bold text-transparent tracking-tighter relative"
            style={{
              WebkitTextStroke: "1px #ff6b6b",
            }}
            animate={{
              filter: [
                "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
                "drop-shadow(0 0 12px rgba(255, 107, 107, 1)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 36px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 48px rgba(255, 107, 107, 0.4))",
                "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ReAMP
          </motion.h1>
        </div>

        {/* Connect Center */}
        <div className="flex flex-col items-center space-y-8">
          {/* Service Connection Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Spotify Connect Button */}
            <motion.div
              className="group relative"
              onMouseEnter={() => setHovered("spotify")}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-[#1ED760] rounded-2xl blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered === "spotify" ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
              <Button
                onClick={() => handleConnect("spotify")}
                disabled={isConnecting === "spotify"}
                className="relative flex items-center space-x-3 px-8 py-4 bg-[#1DB954] hover:bg-[#1AA34A] disabled:bg-gray-600 disabled:cursor-not-allowed rounded-2xl border border-[#1DB954] hover:border-[#1AA34A] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FaSpotify size={24} className="text-white" />
                <span className="text-white text-lg font-medium">
                  {isConnecting === "spotify"
                    ? "Connecting..."
                    : connectedServices.spotify
                    ? "Reconnect Spotify"
                    : "Connect Spotify"}
                </span>
                {/* Status Indicator */}
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectedServices.spotify ? "bg-green-400" : "bg-gray-400"
                  } ${connectedServices.spotify ? "animate-pulse" : ""}`}
                />
              </Button>
            </motion.div>

            {/* Google Connect Button */}
            <motion.div
              className="group relative"
              onMouseEnter={() => setHovered("google")}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-[#4285F4] to-[#3367D6] rounded-2xl blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: hovered === "google" ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
              <Button
                onClick={() => handleConnect("google")}
                disabled={isConnecting === "google"}
                className="relative flex items-center space-x-3 px-8 py-4 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-gray-600 disabled:cursor-not-allowed rounded-2xl border border-[#4285F4] hover:border-[#3367D6] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FaGoogle size={24} className="text-white" />
                <span className="text-white text-lg font-medium">
                  {isConnecting === "google"
                    ? "Connecting..."
                    : connectedServices.youtube
                    ? "Reconnect Google"
                    : "Connect Google"}
                </span>
                {/* Status Indicator */}
                <div
                  className={`w-3 h-3 rounded-full ${
                    connectedServices.youtube ? "bg-green-400" : "bg-gray-400"
                  } ${connectedServices.youtube ? "animate-pulse" : ""}`}
                />
              </Button>
            </motion.div>
          </div>

          {/* Drop a beat! Button */}
          <motion.div
            whileHover={{ scale: hasConnectedService ? 1.05 : 1 }}
            whileTap={{ scale: hasConnectedService ? 0.95 : 1 }}
          >
            <Button
              onClick={handleDropBeat}
              disabled={!hasConnectedService}
              className={`px-12 py-4 text-xl font-bold rounded-2xl transition-all duration-300 shadow-lg ${
                hasConnectedService
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white cursor-pointer"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
            >
              🎵 Drop a beat!
            </Button>
            {/* Debug info */}
            <div className="text-xs text-gray-500 mt-2">
              Debug: hasConnectedService={String(hasConnectedService)}, spotify=
              {String(connectedServices.spotify)}, youtube=
              {String(connectedServices.youtube)}
            </div>
          </motion.div>
        </div>

        {/* Description */}
        <div className="text-center max-w-md">
          <p className="text-gray-400 text-lg">
            {hasConnectedService
              ? "Ready to mix! Connect additional services for more features"
              : "Connect your accounts to access Spotify and YouTube features"}
          </p>
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
              <span className="font-medium">
                {showSuccessToast === "spotify" ? "Spotify" : "Google"}{" "}
                connected successfully!
              </span>
            </div>
          </motion.div>
        )}

        {/* Error Toast */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md"
          >
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse mt-2 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium block">Authentication Error</span>
                <span className="text-sm opacity-90">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-2 text-red-200 hover:text-white transition-colors"
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
          {/* ReAMP Circle */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/20"
            animate={{
              scale: hovered === "spotify" || hovered === "google" ? 1.5 : 1,
              opacity: hovered === "spotify" || hovered === "google" ? 1 : 0,
            }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </div>
  );
}
