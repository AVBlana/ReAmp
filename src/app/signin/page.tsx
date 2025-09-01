"use client";

import { useAuth } from "@/app/context/AuthContext";
import Button from "@/app/components/atoms/Button";
import Icon from "@/app/components/atoms/Icon";
import { FaSpotify, FaGoogle } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignInPage() {
  const { isAuthenticated, signIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">ReAMP</h1>
          <p className="text-gray-400 mb-8">Unified Music Player</p>
          <h2 className="text-2xl font-semibold text-white mb-8">
            Sign in to continue
          </h2>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => signIn("spotify")}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center space-x-3 transition-colors"
          >
            <Icon icon={FaSpotify} className="text-xl" />
            <span>Continue with Spotify</span>
          </Button>

          <Button
            onClick={() => signIn("google")}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 px-4 rounded-lg flex items-center justify-center space-x-3 transition-colors"
          >
            <Icon icon={FaGoogle} className="text-xl" />
            <span>Continue with Google</span>
          </Button>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Connect your accounts to access Spotify and YouTube features</p>
        </div>
      </div>
    </div>
  );
}
