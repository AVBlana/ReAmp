"use client";

import { useYoutube } from "@/context/UnifiedContext";
import PlaylistView from "../PlaylistView";
import { YoutubeVideo } from "../Services/YtService";

const YoutubePlaylistView = () => {
  const {
    playlist,
    removeFromPlaylist,
    setSelectedVideo,
    selectedVideo,
    setPlaylistName,
    playlistName,
    setPlaylist,
  } = useYoutube();

  const handlePlay = (item: { id: string }) => {
    setSelectedVideo(item.id);
  };

  const handleRemove = (index: number) => {
    const updatedPlaylist = [...playlist];
    updatedPlaylist.splice(index, 1);
    removeFromPlaylist(updatedPlaylist[index].id.videoId);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire playlist?")) {
      setPlaylist([]);
    }
  };

  const mappedItems = playlist.map((video) => ({
    id: video.id.videoId,
    title: video.snippet.title,
    artist: {
      name: video.snippet.channelTitle,
    },
    thumbnail: {
      url: video.snippet.thumbnails.medium.url,
      width: video.snippet.thumbnails.medium.width || 320,
      height: video.snippet.thumbnails.medium.height || 180,
    },
  }));

  return (
    <PlaylistView
      items={mappedItems}
      currentItemId={selectedVideo}
      onPlay={handlePlay}
      onRemove={handleRemove}
      onClearAll={handleClearAll}
      playlistName={playlistName}
      onPlaylistNameChange={setPlaylistName}
      theme={{
        primary: "#FF0000",
        secondary: "#ff4d4d",
        accent: "#ff8080",
      }}
      droppableId="youtube-playlist"
      draggablePrefix="youtube"
    />
  );
};

export default YoutubePlaylistView;
