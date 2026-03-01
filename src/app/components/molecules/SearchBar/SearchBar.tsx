import React, { useState, useCallback, useRef, useEffect } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  showClearButton?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  loading?: boolean;
  value?: string; // Allow external control of the input value
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search for songs...",
  debounceMs = 500,
  className = "",
  showClearButton = true,
  autoFocus = false,
  disabled = false,
  loading = false,
  value,
}) => {
  const [internalQuery, setInternalQuery] = useState("");
  const query = value !== undefined ? value : internalQuery;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentQueryRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect - only fire onSearch when trimmed value actually changed to avoid duplicate parent updates
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      lastSentQueryRef.current = "";
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (trimmed === lastSentQueryRef.current) return;
      lastSentQueryRef.current = trimmed;
      onSearch(trimmed);
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, onSearch, debounceMs]);

  const handleClear = useCallback(() => {
    if (value === undefined) {
      setInternalQuery("");
    } else {
      // If value is controlled externally, notify parent to clear
      onSearch("");
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [value, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            if (value === undefined) {
              setInternalQuery(e.target.value);
            } else {
              // If value is controlled externally, we need to notify parent
              onSearch(e.target.value);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full bg-black/20 text-white placeholder-gray-400 rounded-lg pl-4 pr-4 py-2 border-2 border-[#FF6B6B] focus:outline-none focus:bg-black/30 focus:border-[#FF5252] focus:shadow-lg focus:shadow-[#FF6B6B]/25 transition-all duration-200"
          autoComplete="off"
        />

        <div className="absolute right-2 p-2 text-gray-400 hover:text-[#FF6B6B] transition-colors">
          {loading ? (
            <div className="w-4 h-4 border-2 border-[#FF6B6B]/30 border-t-[#FF6B6B] rounded-full animate-spin" />
          ) : (
            <FaSearch size={16} />
          )}
        </div>
      </div>

      {showClearButton && query && !disabled && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <button
            onClick={handleClear}
            className="p-1 min-w-0 bg-transparent hover:bg-[#FF6B6B]/20 text-gray-400 hover:text-[#FF6B6B] transition-all rounded hover:scale-110"
          >
            <FaTimes />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
