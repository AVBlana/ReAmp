import { useState, useEffect, useRef } from "react";

interface SearchProps {
  onSearch: (searchTerm: string) => void;
}

export default function Search({ onSearch }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>("");

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (searchTerm.length >= 3 && searchTerm !== lastSearchRef.current) {
      timeoutRef.current = setTimeout(() => {
        onSearch(searchTerm);
        lastSearchRef.current = searchTerm;
      }, 500);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    if (searchTerm.length >= 3 && searchTerm !== lastSearchRef.current) {
      onSearch(searchTerm);
      lastSearchRef.current = searchTerm;
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="flex">
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          className="flex-grow bg-[#1A1A1A] border border-[#1DB954]/20 text-white rounded-l px-4 py-2 focus:outline-none focus:border-[#1DB954] focus:ring-0 placeholder-gray-400"
          placeholder="Search for tracks on Spotify"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="bg-[#1DB954] text-white px-6 py-2 rounded-r hover:bg-[#1DB954]/80 transition-colors duration-300"
        >
          Search
        </button>
      </div>
    </form>
  );
}
