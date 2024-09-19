import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";

interface SearchProps {
  onSearch: (searchTerm: string) => void;
}

export default function Search({ onSearch }: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce the search function to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term.length >= 3) {
        onSearch(term);
      }
    }, 300),
    [onSearch]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    // Cancel the debounce on useEffect cleanup
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
      <div className="flex">
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          className="flex-grow border text-black border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for YouTube videos"
        />
        <button
          type="button"
          onClick={() => onSearch(searchTerm)}
          className="bg-blue-500 text-white px-6 py-2 rounded-r hover:bg-blue-600 transition-colors duration-300"
        >
          Search
        </button>
      </div>
    </form>
  );
}
