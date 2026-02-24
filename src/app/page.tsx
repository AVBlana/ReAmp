"use client";

import { FaSpotify, FaGoogle } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useConnectedServices } from "@/app/hooks/useConnectedServices";
import { getConnectCallbackUrl } from "@/lib/auth-helpers";
import { getAuthErrorDescription } from "@/types/auth";
import Button from "@/app/components/atoms/Button";

export default function Home() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasShownConnectToast = useRef(false);
  const { isLoading, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get("connected");

  const { spotify, youtube, loading: servicesLoading } = useConnectedServices({
    retryOnMount: !!connectedParam,
    retries: 5,
    retryDelayMs: 300,
  });

  const hasConnectedService = spotify || youtube;

  // Handle OAuth error and URL cleanup
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorMessage(getAuthErrorDescription(error));
      setTimeout(() => setErrorMessage(null), 10000);
      router.replace("/", { scroll: false });
      return;
    }
    if (connectedParam) router.replace("/", { scroll: false });
  }, [connectedParam, searchParams, router]);

  // Show success toast once when returning from OAuth and the service is connected
  useEffect(() => {
    if (
      !connectedParam ||
      hasShownConnectToast.current ||
      (connectedParam === "google" ? !youtube : !spotify)
    )
      return;
    hasShownConnectToast.current = true;
    setShowSuccessToast(connectedParam);
    setTimeout(() => setShowSuccessToast(null), 3000);
  }, [connectedParam, spotify, youtube]);

  const handleConnect = async (provider: "spotify" | "google") => {
    setIsConnecting(provider);
    try {
      const callbackUrl = getConnectCallbackUrl(provider);
      await signIn(provider, { callbackUrl });
    } catch {
      setErrorMessage(getAuthErrorDescription("OAuthSignin"));
    } finally {
      setIsConnecting(null);
    }
  };

  const handleDropBeat = () => {
    if (hasConnectedService) window.location.href = "/reamp";
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
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)]" />

      <div className="relative z-10 flex flex-col items-center space-y-16">
        <div className="relative">
          <motion.h1
            className="text-8xl md:text-9xl font-bold text-transparent tracking-tighter relative"
            style={{ WebkitTextStroke: "1px #ff6b6b" }}
            animate={{
              filter: [
                "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
                "drop-shadow(0 0 12px rgba(255, 107, 107, 1)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 36px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 48px rgba(255, 107, 107, 0.4))",
                "drop-shadow(0 0 8px rgba(255, 107, 107, 0.8)) drop-shadow(0 0 16px rgba(255, 107, 107, 0.6)) drop-shadow(0 0 24px rgba(255, 107, 107, 0.4)) drop-shadow(0 0 32px rgba(255, 107, 107, 0.2))",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            ReAMP
          </motion.h1>
        </div>

        <div className="flex flex-col items-center space-y-8">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
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
                disabled={isConnecting === "spotify" || servicesLoading}
                className="relative flex items-center space-x-3 px-8 py-4 bg-[#1DB954] hover:bg-[#1AA34A] disabled:bg-gray-600 disabled:cursor-not-allowed rounded-2xl border border-[#1DB954] hover:border-[#1AA34A] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FaSpotify size={24} className="text-white" />
                <span className="text-white text-lg font-medium">
                  {isConnecting === "spotify"
                    ? "Connecting..."
                    : spotify
                    ? "Reconnect Spotify"
                    : "Connect Spotify"}
                </span>
                <div
                  className={`w-3 h-3 rounded-full ${spotify ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                />
              </Button>
            </motion.div>

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
                disabled={isConnecting === "google" || servicesLoading}
                className="relative flex items-center space-x-3 px-8 py-4 bg-[#4285F4] hover:bg-[#3367D6] disabled:bg-gray-600 disabled:cursor-not-allowed rounded-2xl border border-[#4285F4] hover:border-[#3367D6] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FaGoogle size={24} className="text-white" />
                <span className="text-white text-lg font-medium">
                  {isConnecting === "google"
                    ? "Connecting..."
                    : youtube
                    ? "Reconnect Google"
                    : "Connect Google"}
                </span>
                <div
                  className={`w-3 h-3 rounded-full ${youtube ? "bg-green-400 animate-pulse" : "bg-gray-400"}`}
                />
              </Button>
            </motion.div>
          </div>

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
          </motion.div>
        </div>

        <div className="text-center max-w-md">
          <p className="text-gray-400 text-lg">
            {hasConnectedService
              ? "Ready to mix! Connect additional services for more features"
              : "Connect your accounts to access Spotify and YouTube features"}
          </p>
        </div>

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

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
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
