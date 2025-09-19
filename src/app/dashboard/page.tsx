"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "@/app/components/atoms/Button";
import Icon from "@/app/components/atoms/Icon";
import { FaSignOutAlt, FaSpotify, FaGoogle } from "react-icons/fa";
import NotificationArea from "@/app/components/organisms/NotificationArea";

interface ConnectedServices {
  spotify: boolean;
  youtube: boolean;
}

export default function DashboardPage() {
  const { isAuthenticated, user, signOut, isLoading } = useAuth();
  const router = useRouter();
  const [connectedServices, setConnectedServices] = useState<ConnectedServices>(
    {
      spotify: false,
      youtube: false,
    }
  );
  const [servicesLoading, setServicesLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch connected services from backend
  useEffect(() => {
    const fetchConnectedServices = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await fetch("/api/user/connected-services");
        if (response.ok) {
          const services = await response.json();
          setConnectedServices(services);
        } else {
          console.error("Failed to fetch connected services");
        }
      } catch (error) {
        console.error("Error fetching connected services:", error);
      } finally {
        setServicesLoading(false);
      }
    };

    fetchConnectedServices();
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400">
              Welcome back, {user?.name || user?.email || "User"}!
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={async () => {
                try {
                  const response = await fetch("/api/test-db");
                  const data = await response.json();
                  console.log("🔍 Database test result:", data);
                  alert(
                    `Database test: ${
                      data.success ? "SUCCESS" : "FAILED"
                    }\nAccounts: ${
                      data.totalAccounts
                    }\nDetails: ${JSON.stringify(data, null, 2)}`
                  );
                } catch (error) {
                  console.error("Error testing database:", error);
                  alert("Error testing database");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <span>Test DB</span>
            </Button>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch("/api/auth/clear-spotify", {
                    method: "POST",
                  });
                  const data = await response.json();
                  if (data.success) {
                    alert(
                      "Spotify account cleared! Please sign in again with Spotify."
                    );
                    window.location.reload();
                  } else {
                    alert("Failed to clear Spotify account: " + data.error);
                  }
                } catch (error) {
                  console.error("Error clearing Spotify account:", error);
                  alert("Error clearing Spotify account");
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Icon icon={FaSpotify} />
              <span>Clear Spotify Account</span>
            </Button>
            <Button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Icon icon={FaSignOutAlt} />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Notification Area */}
        <NotificationArea />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Connected Services</h2>
            {servicesLoading ? (
              <div className="text-gray-400">Loading services...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaSpotify className="text-green-500" />
                    <span>Spotify</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={
                        connectedServices.spotify
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {connectedServices.spotify
                        ? "Connected"
                        : "Not Connected"}
                    </span>
                    {!connectedServices.spotify && (
                      <Button
                        onClick={() =>
                          (window.location.href =
                            "/api/auth/signin/spotify?callbackUrl=" +
                            encodeURIComponent(
                              window.location.origin + "/?connected=spotify"
                            ))
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaGoogle className="text-blue-500" />
                    <span>YouTube (Google)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={
                        connectedServices.youtube
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {connectedServices.youtube
                        ? "Connected"
                        : "Not Connected"}
                    </span>
                    {!connectedServices.youtube && (
                      <Button
                        onClick={() =>
                          (window.location.href =
                            "/api/auth/signin/google?callbackUrl=" +
                            encodeURIComponent(
                              window.location.origin + "/?connected=google"
                            ))
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/reamp")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Open Music Player
              </Button>
              <Button
                onClick={() => router.push("/")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
