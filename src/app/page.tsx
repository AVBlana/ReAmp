"use client";

import Search from "./components/Search";
import YtSearchResultsList from "./components/YtSearchResultsList";
import PlaylistView from "./components/PlaylistView";
import { getYouTubeVideos } from "./components/Services/YtService";
import Player from "./components/Player";
import { useAppContext } from "./AppContext";

export default function Home() {
  const { searchResults, setSearchResults, setSelectedVideo } = useAppContext();

  const handleSearch = async (searchTerm: string) => {
    const results = await getYouTubeVideos(searchTerm);
    setSearchResults(results);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-8">ReAmp Project</h1>
        <Search onSearch={handleSearch} />
      </div>
      <div className="flex justify-between gap-8">
        <Player />
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-bold mb-4">Search Results</h2>
          <YtSearchResultsList
            searchResults={searchResults}
            setSelectedVideo={setSelectedVideo}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <PlaylistView setSelectedVideo={setSelectedVideo} />
        </div>
      </div>
    </div>
  );
}
