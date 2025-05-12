import { useState, useEffect, useRef } from "react";
import { useYoutube } from "@/context/UnifiedContext";
import SearchResultsContainer from "../SearchResultsContainer";
import YtSearchResultsItem from "../YtSearchResultsItem";

interface YoutubeSearchProps {
  onSearch: (searchTerm: string) => void;
}

export default function YoutubeSearch({ onSearch }: YoutubeSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { searchResults, setSelectedVideo } = useYoutube();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchTerm.length >= 3 && searchTerm !== lastSearchRef.current) {
      timeoutRef.current = setTimeout(() => {
        onSearch(searchTerm);
        lastSearchRef.current = searchTerm;
        setIsDropdownOpen(true);
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, onSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    if (searchTerm.length >= 3 && searchTerm !== lastSearchRef.current) {
      onSearch(searchTerm);
      lastSearchRef.current = searchTerm;
      setIsDropdownOpen(true);
    }
  };

  return (
    <div className="relative" ref={searchContainerRef}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={handleChange}
            onFocus={() => searchResults.length > 0 && setIsDropdownOpen(true)}
            className="flex-grow bg-[#1A1A1A] border border-[#FF0000]/20 text-white rounded-l px-4 py-2 focus:outline-none focus:border-[#FF0000] focus:ring-0 placeholder-gray-400"
            placeholder="Search for videos on YouTube"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="bg-[#FF0000] text-white px-6 py-2 rounded-r hover:bg-[#FF0000]/80 transition-colors duration-300"
          >
            Search
          </button>
        </div>
      </form>

      <SearchResultsContainer
        isOpen={isDropdownOpen && searchResults.length > 0}
        theme={{
          primary: "#FF0000",
          secondary: "#FF0000",
        }}
      >
        {searchResults.map((video) => (
          <YtSearchResultsItem
            key={video.id.videoId}
            video={video}
            onPlay={setSelectedVideo}
          />
        ))}
      </SearchResultsContainer>
    </div>
  );
}
