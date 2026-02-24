"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Button from "@/app/components/atoms/Button";
import { useRouter } from "next/navigation";
import { getAuthErrorDescription } from "@/types/auth";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string>("");
  const [errorDescription, setErrorDescription] = useState<string>("");

  useEffect(() => {
    const code = searchParams.get("error");
    setErrorCode(code || "Unknown error");
    setErrorDescription(getAuthErrorDescription(code));
  }, [searchParams]);

  const isConfigurationError = errorCode === "Configuration";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">ReAMP</h1>
          <p className="text-gray-400 mb-8">Unified Music Player</p>

          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-red-400 mb-4">
              Authentication Error
            </h2>
            <p className="text-red-300 mb-2">
              <strong>Error:</strong> {errorCode}
            </p>
            <p className="text-gray-300 text-sm">{errorDescription}</p>
            {isConfigurationError && (
              <div className="mt-4 p-3 bg-amber-900/30 border border-amber-600/50 rounded text-left text-sm text-amber-200">
                <p className="font-medium mb-1">Common cause:</p>
                <p>
                  If you started login on <strong>localhost</strong> but
                  NEXTAUTH_URL is set to your production URL, Spotify redirects
                  to production and the session state is lost. In{" "}
                  <code className="bg-black/30 px-1 rounded">.env.local</code>{" "}
                  use <code className="bg-black/30 px-1 rounded">NEXTAUTH_URL=http://localhost:3000</code> for
                  local dev. Use the production URL only in Vercel env.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Go Home
            </Button>
          </div>

          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>
              If this problem persists, please check your OAuth configuration
              and ensure all required environment variables are set correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-white text-xl">Loading...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
