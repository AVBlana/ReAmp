"use client";

import Search from "./components/Search";
import YtSearchResultsList from "./components/YtSearchResultsList";
import PlaylistView from "./components/PlaylistView";
import { getYouTubeVideos } from "./components/Services/YtService";
import Player from "./components/Player";
import { useAppContext } from "./AppContext";

export default function Home() {
  const {
    searchResults,
    setSearchResults,
    setSelectedVideo,
    nextPageToken,
    setNextPageToken,
    currentSearchTerm,
    setCurrentSearchTerm,
  } = useAppContext();

  const handleSearch = async (searchTerm: string) => {
    setCurrentSearchTerm(searchTerm);
    const { items, nextPageToken } = await getYouTubeVideos(searchTerm);
    setSearchResults(items);
    setNextPageToken(nextPageToken);
  };

  const handleLoadMore = async () => {
    if (nextPageToken && currentSearchTerm) {
      const { items, nextPageToken: newNextPageToken } = await getYouTubeVideos(
        currentSearchTerm,
        nextPageToken
      );
      setSearchResults([...searchResults, ...items]);
      setNextPageToken(newNextPageToken);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-8">ReAmp Project</h1>
        <Search onSearch={handleSearch} />
      </div>
      <div className="flex w-full py-8">
        <Player />
      </div>

      <div className="flex gap-8">
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Search Results</h2>
          <YtSearchResultsList
            searchResults={searchResults}
            setSelectedVideo={setSelectedVideo}
          />
          {nextPageToken && (
            <button
              onClick={handleLoadMore}
              className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors duration-300"
            >
              Show More Results
            </button>
          )}
        </div>
        <div className="flex flex-col gap-8">
          <div className="w-full">
            <PlaylistView />
          </div>
        </div>
      </div>
    </div>
  );
}
