"use client";

import { useState } from "react";

export default function DebugPlayer() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestResults((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const testSpotifyAuth = async () => {
    addLog("Testing Spotify authentication...");
    const token = localStorage.getItem("spotify_token");
    if (token) {
      addLog("✅ Spotify token found");

      try {
        const response = await fetch(
          "https://api.spotify.com/v1/me/player/devices",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          addLog(`✅ Found ${data.devices?.length || 0} devices`);
          if (data.devices && data.devices.length > 0) {
            data.devices.forEach((device: any, index: number) => {
              addLog(
                `  Device ${index + 1}: ${device.name} (${
                  device.type
                }) - Active: ${device.is_active}`
              );
            });
          } else {
            addLog(
              "❌ No devices available - Please open Spotify on any device"
            );
          }
        } else {
          addLog(`❌ Failed to get devices: ${response.status}`);
        }
      } catch (error) {
        addLog(
          `❌ Error testing devices: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } else {
      addLog("❌ No Spotify token found - Please login to Spotify");
    }
  };

  const testYouTubeAPI = () => {
    addLog("Testing YouTube API...");
    if (window.YT) {
      addLog("✅ YouTube API loaded");
    } else {
      addLog("❌ YouTube API not loaded");
      addLog("   Loading YouTube API...");

      // Try to load the API
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];

      try {
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
        addLog("   YouTube API script added");
      } catch (error) {
        addLog(
          `   Error loading YouTube API: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <div className="fixed bottom-4 left-4 bg-black/90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold">Debug Player</h3>
        <button
          onClick={clearLogs}
          className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
        >
          Clear
        </button>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={testSpotifyAuth}
          className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700"
        >
          Test Spotify
        </button>
        <button
          onClick={testYouTubeAPI}
          className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-700"
        >
          Test YouTube
        </button>
      </div>

      <div className="text-xs space-y-1">
        {testResults.map((result, index) => (
          <div key={index} className="font-mono">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
}
