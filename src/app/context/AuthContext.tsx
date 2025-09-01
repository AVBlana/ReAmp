"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Session } from "next-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  user: Session["user"] | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (provider?: string) => Promise<void>;
  signOut: () => Promise<void>;
  getSpotifyToken: () => string | null;
  getGoogleToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  const handleSignIn = async (provider?: string) => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const getSpotifyToken = (): string | null => {
    return session?.providers?.spotify?.accessToken || null;
  };

  const getGoogleToken = (): string | null => {
    return session?.providers?.google?.accessToken || null;
  };

  const value: AuthContextType = {
    isAuthenticated: !!session,
    user: session?.user || null,
    session,
    isLoading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    getSpotifyToken,
    getGoogleToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
