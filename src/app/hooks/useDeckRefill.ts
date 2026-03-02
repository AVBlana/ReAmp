"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ServiceType, Song } from "@/app/types/playerTypes";
import { YoutubeVideo } from "@/app/types/youtubeTypes";
import {
  type Track,
  type PlaybackStateSnapshot,
  type RefillResult,
  getDeckTrackId,
  playNext,
  markAsPlayed as markAsPlayedEngine,
} from "@/lib/playbackEngine";

/** Playlist item shape used by UnifiedContext (id + type + data). */
interface PlaylistItemLike {
  id: string;
  type: ServiceType;
  data: Song | YoutubeVideo;
}

function playlistItemToTrack(item: PlaylistItemLike): Track {
  if (item.type === ServiceType.Spotify) {
    const s = item.data as Song;
    return {
      id: s.id,
      title: s.title,
      artist: s.artist.name,
      source: "spotify",
      externalId: s.id,
    };
  }
  const v = item.data as YoutubeVideo;
  return {
    id: v.id.videoId,
    title: v.snippet.title,
    artist: v.snippet.channelTitle,
    source: "youtube",
    externalId: v.id.videoId,
  };
}

export interface UseDeckRefillProps {
  /** Current unified playlist items. */
  playlist: PlaylistItemLike[];
  /** Get current deck state (currentTrack, etc.). */
  getDeckState: (deckId: "A" | "B") => {
    currentTrack: Song | YoutubeVideo | null;
  };
  /** Current track id on deck A (for stable effect deps). */
  deckTrackIdA: string | null;
  /** Current track id on deck B (for stable effect deps). */
  deckTrackIdB: string | null;
  /** Load a track into a deck. */
  loadTrack: (deckId: "A" | "B", track: Song | YoutubeVideo) => Promise<void>;
  /** Whether auto-refill is enabled. */
  enabled?: boolean;
  /** Refill only when deck has been empty for this many ms (debounce). */
  refillDelayMs?: number;
}

export function useDeckRefill({
  playlist,
  getDeckState,
  deckTrackIdA,
  deckTrackIdB,
  loadTrack,
  enabled = true,
  refillDelayMs = 500,
}: UseDeckRefillProps) {
  const [playedTrackIds, setPlayedTrackIds] = useState<string[]>([]);
  const [lastPlayedTrackId, setLastPlayedTrackId] = useState<string | null>(null);
  const prevDeckTrackIdsRef = useRef<{ A: string | null; B: string | null }>({
    A: null,
    B: null,
  });
  const refillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When set, next refill for this deck will prefer Spotify to avoid a chain of YouTube 150s. */
  const preferSpotifyForDeckRef = useRef<"A" | "B" | null>(null);
  /** YouTube (and similar) track IDs that returned embed disabled (150). Skip loading these; mark played and pick next. */
  const embedDisabledTrackIdsRef = useRef<Set<string>>(new Set());
  /**
   * Once we've seen at least one embed-disabled YouTube (150/101) in this session,
   * stop auto-refill from picking *any* YouTube tracks. This avoids repeatedly
   * mounting new YouTube videos that are likely to 150 as well, especially in
   * YouTube‑heavy playlists. Manual drops can still load YouTube.
   */
  const avoidYouTubeAutoRefillRef = useRef<boolean>(false);
  const buildSnapshotRef = useRef<() => PlaybackStateSnapshot>(() => ({
    playlistTracks: [],
    deckTrackIds: { A: null, B: null },
    playedTrackIds: [],
    lastPlayedTrackId: null,
  }));
  const tryRefillDeckRef = useRef<(deckId: "A" | "B") => Promise<void>>(async () => {});

  const markTrackPlayed = useCallback((trackId: string) => {
    setPlayedTrackIds((prev) =>
      prev.includes(trackId) ? prev : [...prev, trackId]
    );
    setLastPlayedTrackId(trackId);
  }, []);

  const markEmbedDisabled = useCallback((trackId: string) => {
    embedDisabledTrackIdsRef.current.add(trackId);
    // Once we know at least one video in this playlist is embed-disabled,
    // disable YouTube for automatic refills and stick to Spotify for safety.
    avoidYouTubeAutoRefillRef.current = true;
  }, []);

  const isEmbedDisabled = useCallback((trackId: string) => {
    return embedDisabledTrackIdsRef.current.has(trackId);
  }, []);

  const buildSnapshot = useCallback((): PlaybackStateSnapshot => {
    const deckA = getDeckState("A").currentTrack;
    const deckB = getDeckState("B").currentTrack;
    return {
      playlistTracks: playlist.map(playlistItemToTrack),
      deckTrackIds: {
        A: getDeckTrackId(deckA),
        B: getDeckTrackId(deckB),
      },
      playedTrackIds,
      lastPlayedTrackId,
    };
  }, [playlist, getDeckState, playedTrackIds, lastPlayedTrackId]);
  buildSnapshotRef.current = buildSnapshot;

  const tryRefillDeck = useCallback(
    async (deckId: "A" | "B") => {
      if (!enabled || playlist.length === 0) return;

      const snapshot = buildSnapshot();
      if (snapshot.deckTrackIds[deckId] !== null) return; // deck already has a track

      // Build a snapshot for picking that:
      // 1) Excludes specific tracks that already returned embed disabled (150)
      // 2) Optionally excludes *all* YouTube tracks once we've seen any 150,
      //    so auto-refill sticks to Spotify and doesn't keep hitting 150s.
      const excludedIds = embedDisabledTrackIdsRef.current;
      const snapshotForPick: PlaybackStateSnapshot = {
        ...snapshot,
        playlistTracks: snapshot.playlistTracks.filter((t) => {
          if (excludedIds.has(t.id)) return false;
          if (avoidYouTubeAutoRefillRef.current && t.source === "youtube") {
            return false;
          }
          return true;
        }),
      };

      const preferSpotify = preferSpotifyForDeckRef.current === deckId;
      if (preferSpotify) preferSpotifyForDeckRef.current = null;
      const result: RefillResult = playNext(snapshotForPick, deckId, {
        preferSource: preferSpotify ? "spotify" : undefined,
      });

      if (!result.trackToLoad) return;

      const item = playlist.find((p) => p.id === result.trackToLoad!.id);
      if (!item) return;

      // Defer loading Spotify tracks so we don't run SDK/DRM init on the main thread right after
      // crossfade — that can block and cause the other deck (e.g. YouTube) to buffer/stutter.
      const isSpotify = item.type === ServiceType.Spotify;
      const deferMs = isSpotify ? 800 : 0;

      const doLoad = async () => {
        try {
          await loadTrack(deckId, item.data);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "VIDEO_EMBED_DISABLED") {
            markEmbedDisabled(result.trackToLoad!.id);
          }
          console.warn(`Deck refill: failed to load track into deck ${deckId}:`, err);
          markTrackPlayed(result.trackToLoad!.id);
          setTimeout(() => tryRefillDeckRef.current(deckId), 300);
        }
      };

      if (deferMs > 0) {
        setTimeout(() => doLoad(), deferMs);
      } else {
        await doLoad();
      }
    },
    [enabled, playlist, buildSnapshot, loadTrack, markTrackPlayed, markEmbedDisabled]
  );
  tryRefillDeckRef.current = tryRefillDeck;

  // When a deck loses its track (e.g. after crossfade or clear), mark that track as played and schedule refill.
  // Only depend on deck ids and delay — use refs for buildSnapshot/tryRefillDeck so the timeout isn't cleared
  // every time playerStates (or progress) updates and causes new callback references.
  useEffect(() => {
    if (!enabled) return;

    const currentA = deckTrackIdA;
    const currentB = deckTrackIdB;
    const prev = prevDeckTrackIdsRef.current;

    // Mark as played when a deck had a track and now doesn't.
    if (prev.A !== null && currentA === null) {
      const snapshot = buildSnapshotRef.current();
      const updated = markAsPlayedEngine(
        { ...snapshot, deckTrackIds: { A: prev.A, B: currentB } },
        prev.A
      );
      setPlayedTrackIds(updated.playedTrackIds);
      setLastPlayedTrackId(updated.lastPlayedTrackId);
    }
    if (prev.B !== null && currentB === null) {
      const snapshot = buildSnapshotRef.current();
      const updated = markAsPlayedEngine(
        { ...snapshot, deckTrackIds: { A: currentA, B: prev.B } },
        prev.B
      );
      setPlayedTrackIds(updated.playedTrackIds);
      setLastPlayedTrackId(updated.lastPlayedTrackId);
    }

    prevDeckTrackIdsRef.current = { A: currentA, B: currentB };

    // Schedule refill for empty decks (debounced). Use refs so timeout isn't cleared by progress-driven re-renders.
    const scheduleRefill = (deckId: "A" | "B") => {
      if (refillTimeoutRef.current) clearTimeout(refillTimeoutRef.current);
      refillTimeoutRef.current = setTimeout(() => {
        refillTimeoutRef.current = null;
        tryRefillDeckRef.current(deckId);
        tryRefillDeckRef.current(deckId === "A" ? "B" : "A");
      }, refillDelayMs);
    };

    if (currentA === null) scheduleRefill("A");
    if (currentB === null) scheduleRefill("B");

    return () => {
      if (refillTimeoutRef.current) {
        clearTimeout(refillTimeoutRef.current);
        refillTimeoutRef.current = null;
      }
    };
  }, [enabled, deckTrackIdA, deckTrackIdB, refillDelayMs]);

  const setPreferSpotifyForNextRefill = useCallback((deckId: "A" | "B" | null) => {
    preferSpotifyForDeckRef.current = deckId;
  }, []);

  return {
    markTrackPlayed,
    playedTrackIds,
    lastPlayedTrackId,
    setPreferSpotifyForNextRefill,
    markEmbedDisabled,
    isEmbedDisabled,
  };
}
