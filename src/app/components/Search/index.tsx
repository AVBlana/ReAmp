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
    <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
      <div className="flex">
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          className="flex-grow border text-black border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search for YouTube videos"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="bg-green-500 text-white px-6 py-2 rounded-r hover:bg-green-600 transition-colors duration-300"
        >
          Search
        </button>
      </div>
    </form>
  );
}
