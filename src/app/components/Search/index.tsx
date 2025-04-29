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
          className="flex-grow bg-[#1A1A1A] border border-[#FF0000]/10 text-white rounded-l px-4 py-2 focus:outline-none focus:border-[#FF0000] focus:ring-0 placeholder-gray-400"
          placeholder="Search for YouTube videos"
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
  );
}
