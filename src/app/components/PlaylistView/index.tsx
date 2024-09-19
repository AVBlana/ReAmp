import Image from "next/image";
import { FaPlay, FaTrash } from "react-icons/fa";
import { useAppContext } from "@/app/AppContext";

interface PlaylistViewProps {
  setSelectedVideo: (videoId: string) => void;
}

export default function PlaylistView({ setSelectedVideo }: PlaylistViewProps) {
  const { playlist, removeFromPlaylist } = useAppContext();

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Your Playlist</h2>
      {playlist.length === 0 ? (
        <p>Your playlist is empty. Add some videos from the search results!</p>
      ) : (
        <div className="space-y-4">
          {playlist.map((video) => (
            <div
              key={video.id.videoId}
              className="flex border rounded-lg overflow-hidden shadow-md"
            >
              <div className="w-32 flex-shrink-0 relative group">
                <Image
                  src={video.snippet.thumbnails.medium.url}
                  width={video.snippet.thumbnails.medium.width}
                  height={video.snippet.thumbnails.medium.height}
                  alt={video.snippet.title}
                  className="object-cover w-full h-full"
                />
                <div
                  className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  onClick={() => setSelectedVideo(video.id.videoId)}
                >
                  <FaPlay className="text-white text-2xl" />
                </div>
              </div>
              <div className="flex-grow p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">
                  {video.snippet.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {video.snippet.channelTitle}
                </p>
              </div>
              <div className="flex items-center pr-4">
                <button
                  onClick={() => removeFromPlaylist(video.id.videoId)}
                  className="text-red-500 hover:text-red-700 transition-colors duration-300"
                  title="Remove from playlist"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
