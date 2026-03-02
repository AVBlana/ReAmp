/**
 * Playback engine: pure logic for deck refill, unused tracks, and play-next.
 * No React, no side effects. Consumed by useDeckRefill and components.
 */

/** Normalized track for engine logic (Spotify + YouTube). */
export type Track = {
  id: string;
  title: string;
  artist: string;
  source: "spotify" | "youtube";
  externalId: string;
};

/** Snapshot of deck state for pure functions (track id or null). */
export type DeckStateSnapshot = {
  A: string | null;
  B: string | null;
};

/** Playback state snapshot passed into the engine. */
export type PlaybackStateSnapshot = {
  playlistTracks: Track[];
  deckTrackIds: DeckStateSnapshot;
  playedTrackIds: string[];
  /** Last played track id (for same-artist prevention). */
  lastPlayedTrackId: string | null;
};

/** Result of refill: which track to load (if any). */
export type RefillResult = {
  trackToLoad: Track | null;
  updatedPlayedIds: string[];
  updatedLastPlayedId: string | null;
};

const BLOCK_LAST_N = 5;

/**
 * Get track id from current deck track (Song has .id, YoutubeVideo has .id.videoId).
 */
export function getDeckTrackId(
  currentTrack: { id: string } | { id: { videoId: string } } | null
): string | null {
  if (!currentTrack) return null;
  if ("id" in currentTrack && typeof currentTrack.id === "string")
    return currentTrack.id;
  const y = currentTrack as { id: { videoId: string } };
  return y.id?.videoId ?? null;
}

/**
 * Get artist from a normalized Track (for same-artist check).
 */
export function getArtistFromTrack(track: Track): string {
  return track.artist;
}

/**
 * Returns tracks that: are in playlist, not in playedIds, not currently in either deck.
 * Immutable: does not mutate state.
 */
export function getUnusedTracks(state: PlaybackStateSnapshot): Track[] {
  const { playlistTracks, deckTrackIds, playedTrackIds } = state;
  const inDecks = new Set<string>([
    deckTrackIds.A,
    deckTrackIds.B,
  ].filter(Boolean) as string[]);
  const played = new Set(playedTrackIds);

  return playlistTracks.filter(
    (t) => !inDecks.has(t.id) && !played.has(t.id)
  );
}

/**
 * Fisher–Yates shuffle. Mutates the array in place; returns the same array for chaining.
 * Call with a copy if you need to preserve original: fisherYatesShuffle([...arr])
 */
export function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * When all tracks have been played: soft reset — keep last BLOCK_LAST_N played, allow rest.
 */
export function softResetPlayedIds(playedTrackIds: string[]): string[] {
  if (playedTrackIds.length <= BLOCK_LAST_N) return playedTrackIds;
  return playedTrackIds.slice(-BLOCK_LAST_N);
}

/**
 * Pick next track to load for a deck: unused, optionally avoid same artist as last.
 * Single-artist playlists: same-artist filter is only applied when it leaves at least
 * one candidate. When no unused after soft reset (e.g. 2 tracks, one in deck one cleared),
 * we do a full reset (allow any track not in a deck) so the emptied deck can refill.
 * Returns null if no candidate. Immutable.
 */
export function pickNextTrack(
  state: PlaybackStateSnapshot,
  deckName: "A" | "B",
  options: {
    avoidSameArtist?: boolean;
    count?: number;
    /** After YouTube 150, prefer picking a Spotify track to avoid a chain of embed-disabled videos. */
    preferSource?: "spotify" | "youtube";
  } = {}
): { track: Track | null; updatedPlayedIds: string[]; updatedLastPlayedId: string | null } {
  const { avoidSameArtist = true, count = 1, preferSource } = options;
  let unused = getUnusedTracks(state);

  if (unused.length === 0) {
    const resetIds = softResetPlayedIds(state.playedTrackIds);
    const nextState: PlaybackStateSnapshot = {
      ...state,
      playedTrackIds: resetIds,
    };
    unused = getUnusedTracks(nextState);
    // Full reset: e.g. 2-track or single-artist playlist — one deck empty, one has the only track; allow the cleared track again
    if (unused.length === 0) {
      const noPlayedState: PlaybackStateSnapshot = {
        ...state,
        playedTrackIds: [],
      };
      unused = getUnusedTracks(noPlayedState);
    }
    if (unused.length === 0)
      return {
        track: null,
        updatedPlayedIds: state.playedTrackIds,
        updatedLastPlayedId: state.lastPlayedTrackId,
      };
  }

  let candidates = [...unused];
  // After 150, prefer the other source to avoid loading another non-embeddable YouTube
  if (preferSource && candidates.length > 0) {
    const bySource = candidates.filter((t) => t.source === preferSource);
    if (bySource.length > 0) candidates = bySource;
  }
  // Only apply same-artist filter when it leaves at least one candidate (single-artist playlists still get a pick)
  if (avoidSameArtist && state.lastPlayedTrackId) {
    const lastTrack = state.playlistTracks.find((t) => t.id === state.lastPlayedTrackId);
    const lastArtist = lastTrack?.artist;
    if (lastArtist) {
      const withoutSameArtist = candidates.filter((t) => t.artist !== lastArtist);
      if (withoutSameArtist.length > 0) candidates = withoutSameArtist;
    }
  }

  fisherYatesShuffle(candidates);
  const pick = candidates[0] ?? null;
  if (!pick)
    return {
      track: null,
      updatedPlayedIds: state.playedTrackIds,
      updatedLastPlayedId: state.lastPlayedTrackId,
    };

  return {
    track: pick,
    updatedPlayedIds: state.playedTrackIds,
    updatedLastPlayedId: state.lastPlayedTrackId,
  };
}

/**
 * Refill a deck: pick next track(s). Returns the first track to load and updated state.
 * Immutable: returns new playedIds and lastPlayedId; caller applies them.
 * Use preferSource: 'spotify' after YouTube 150 to avoid a chain of embed-disabled videos.
 */
export function refillDeck(
  state: PlaybackStateSnapshot,
  deckName: "A" | "B",
  count: number = 3,
  options: { preferSource?: "spotify" | "youtube" } = {}
): RefillResult {
  const result = pickNextTrack(state, deckName, {
    avoidSameArtist: true,
    count,
    preferSource: options.preferSource,
  });
  return {
    trackToLoad: result.track,
    updatedPlayedIds: result.updatedPlayedIds,
    updatedLastPlayedId: result.updatedLastPlayedId,
  };
}

/**
 * Mark a track as played. Returns new state (new arrays). Immutable.
 */
export function markAsPlayed(
  state: PlaybackStateSnapshot,
  trackId: string
): { playedTrackIds: string[]; lastPlayedTrackId: string | null } {
  const playedTrackIds = state.playedTrackIds.includes(trackId)
    ? state.playedTrackIds
    : [...state.playedTrackIds, trackId];
  return {
    playedTrackIds,
    lastPlayedTrackId: trackId,
  };
}

/**
 * Compute "play next" for a deck: same as refill (pick one next track).
 * Alias for clarity at call sites.
 */
export function playNext(
  state: PlaybackStateSnapshot,
  deckName: "A" | "B",
  options: { preferSource?: "spotify" | "youtube" } = {}
): RefillResult {
  return refillDeck(state, deckName, 1, options);
}
