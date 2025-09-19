"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Button from "@/app/components/atoms/Button";
import { useRouter } from "next/navigation";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [errorDescription, setErrorDescription] = useState<string>("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    setError(errorParam || "Unknown error");

    // Map error codes to user-friendly messages
    switch (errorParam) {
      case "Configuration":
        setErrorDescription(
          "There's a configuration issue with the authentication service. Please check your environment variables and OAuth settings."
        );
        break;
      case "AccessDenied":
        setErrorDescription(
          "Access was denied. You may have cancelled the authentication process or the app doesn't have the required permissions."
        );
        break;
      case "Verification":
        setErrorDescription(
          "The verification token has expired or is invalid. Please try signing in again."
        );
        break;
      case "OAuthSignin":
        setErrorDescription(
          "There was an error during the OAuth sign-in process. Please try again."
        );
        break;
      case "OAuthCallback":
        setErrorDescription(
          "There was an error during the OAuth callback process. Please try again."
        );
        break;
      case "OAuthCreateAccount":
        setErrorDescription(
          "There was an error creating your account. Please try again."
        );
        break;
      case "EmailCreateAccount":
        setErrorDescription(
          "There was an error creating your account with email. Please try again."
        );
        break;
      case "Callback":
        setErrorDescription(
          "There was an error during the callback process. Please try again."
        );
        break;
      case "OAuthAccountNotLinked":
        setErrorDescription(
          "This account is already associated with another sign-in method. Please use the original sign-in method."
        );
        break;
      case "EmailSignin":
        setErrorDescription(
          "There was an error sending the sign-in email. Please try again."
        );
        break;
      case "CredentialsSignin":
        setErrorDescription(
          "There was an error with your credentials. Please check your username and password."
        );
        break;
      case "SessionRequired":
        setErrorDescription(
          "You need to be signed in to access this page. Please sign in first."
        );
        break;
      default:
        setErrorDescription(
          "An unexpected error occurred during authentication. Please try again."
        );
    }
  }, [searchParams]);

  const handleRetry = () => {
    router.push("/");
  };

  const handleGoHome = () => {
    router.push("/");
  };

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
              <strong>Error:</strong> {error}
            </p>
            <p className="text-gray-300 text-sm">{errorDescription}</p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
            >
              Try Again
            </Button>

            <Button
              onClick={handleGoHome}
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
