"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/context/AuthContext";

export interface ConnectedServicesState {
  spotify: boolean;
  youtube: boolean;
}

const DEFAULT_STATE: ConnectedServicesState = {
  spotify: false,
  youtube: false,
};

function parseApiResponse(data: unknown): ConnectedServicesState {
  if (!data || typeof data !== "object") return DEFAULT_STATE;
  const user = (data as { user?: { providers?: Partial<ConnectedServicesState> } })
    .user;
  const providers = user?.providers;
  if (!providers) return DEFAULT_STATE;
  return {
    spotify: !!providers.spotify,
    youtube: !!providers.youtube,
  };
}

export function useConnectedServices(options?: {
  /** When true, refetch with retries (e.g. after OAuth callback). */
  retryOnMount?: boolean;
  retries?: number;
  retryDelayMs?: number;
}) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<ConnectedServicesState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(
    async (withRetry = false) => {
      const retries = options?.retries ?? 5;
      const delay = options?.retryDelayMs ?? 300;

      const doFetch = async (): Promise<ConnectedServicesState> => {
        const res = await fetch("/api/user/connected-services", {
          credentials: "include",
          headers: withRetry ? { "Cache-Control": "no-cache" } : undefined,
        });
        if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return parseApiResponse(data);
      };

      if (withRetry) {
        for (let i = 0; i < retries; i++) {
          try {
            const next = await doFetch();
            setState(next);
            setError(null);
            return next;
          } catch (e) {
            if (i < retries - 1) await new Promise((r) => setTimeout(r, delay));
            else throw e;
          }
        }
      }

      try {
        const next = await doFetch();
        setState(next);
        setError(null);
        return next;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
        return DEFAULT_STATE;
      } finally {
        setLoading(false);
      }
    },
    [options?.retries, options?.retryDelayMs]
  );

  const refetch = useCallback(
    (withRetry = false) => {
      setLoading(true);
      return fetchServices(withRetry).finally(() => setLoading(false));
    },
    [fetchServices]
  );

  useEffect(() => {
    setLoading(true);
    fetchServices(options?.retryOnMount ?? false).finally(() =>
      setLoading(false)
    );
  }, [isAuthenticated, options?.retryOnMount, fetchServices]);

  return {
    ...state,
    loading,
    error,
    refetch,
  };
}
