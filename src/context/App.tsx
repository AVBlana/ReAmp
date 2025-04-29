"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AppContextType {
  spotifyToken: string;
  refreshSpotifyToken: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  spotifyToken: "",
  refreshSpotifyToken: async () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [spotifyToken, setSpotifyToken] = useState<string>("");

  const refreshSpotifyToken = async () => {
    try {
      const response = await fetch("/api/spotify/refresh");
      const data = await response.json();
      setSpotifyToken(data.access_token);
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("spotify_token");
    if (token) {
      setSpotifyToken(token);
    }
  }, []);

  return (
    <AppContext.Provider value={{ spotifyToken, refreshSpotifyToken }}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext };
