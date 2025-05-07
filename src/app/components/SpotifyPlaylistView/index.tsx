"use client";

import { useSpotify } from "@/context/UnifiedContext";
import PlaylistView from "../PlaylistView";
import { Song } from "@/types/playerTypes";

const SpotifyPlaylistView = () => {
  const {
    playlist,
    setPlaylist,
    currentSong,
    setCurrentSong,
    playlistName,
    setPlaylistName,
  } = useSpotify();

  const handlePlay = (item: { id: string }) => {
    const song = playlist.find((s) => s.id === item.id);
    if (song) {
      setCurrentSong(song);
    }
  };

  const handleRemove = (index: number) => {
    const updatedPlaylist = [...playlist];
    updatedPlaylist.splice(index, 1);
    setPlaylist(updatedPlaylist);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire playlist?")) {
      setPlaylist([]);
    }
  };

  const mappedItems = playlist.map((song) => ({
    id: song.id,
    title: song.title,
    artist: {
      name: song.artist.name,
    },
    artwork: song.artwork,
  }));

  return (
    <PlaylistView
      items={mappedItems}
      currentItemId={currentSong?.id || null}
      onPlay={handlePlay}
      onRemove={handleRemove}
      onClearAll={handleClearAll}
      playlistName={playlistName}
      onPlaylistNameChange={setPlaylistName}
      theme={{
        primary: "#1DB954",
        secondary: "#1ed760",
        accent: "#1fdf64",
      }}
      droppableId="spotify-playlist"
      draggablePrefix="spotify"
    />
  );
};

export default SpotifyPlaylistView;
