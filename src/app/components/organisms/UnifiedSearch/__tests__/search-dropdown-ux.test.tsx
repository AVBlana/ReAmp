import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UnifiedSearchRefactored from "../UnifiedSearchRefactored";
import { useUnifiedContext } from "@/app/context/UnifiedContext";

// Mock the UnifiedContext
jest.mock("@/app/context/UnifiedContext");
const mockUseUnifiedContext = useUnifiedContext as jest.MockedFunction<typeof useUnifiedContext>;

// Mock the useOutsideClick hook
jest.mock("@/app/hooks", () => ({
  useOutsideClick: jest.fn((ref, callback) => {
    // Simulate clicking outside by calling the callback
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          callback();
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, callback]);
  }),
}));

describe("Search Dropdown UX", () => {
  const mockOnSearch = jest.fn();
  const mockOnLoadMore = jest.fn();

  const mockUnifiedContext = {
    youtube: {
      searchResults: [],
      setSearchResults: jest.fn(),
      setNextPageToken: jest.fn(),
      setCurrentSearchTerm: jest.fn(),
    },
    spotify: {
      searchResults: [],
      setSearchResults: jest.fn(),
      setNextPageToken: jest.fn(),
      setCurrentSearchTerm: jest.fn(),
    },
    unified: {
      playlist: [],
      addToPlaylist: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUnifiedContext.mockReturnValue(mockUnifiedContext);
  });

  it("should not open dropdown on focus if no previous search results", () => {
    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");
    
    // Focus the input
    fireEvent.focus(searchInput);
    
    // Should not show results container
    expect(screen.queryByTestId("search-results-container")).not.toBeInTheDocument();
  });

  it("should open dropdown on focus if previous search results exist", async () => {
    // Mock search results
    mockUnifiedContext.youtube.searchResults = [
      {
        id: { videoId: "123" },
        snippet: {
          title: "Test Video",
          thumbnails: { default: { url: "test.jpg" } },
        },
      },
    ];

    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");
    
    // First, perform a search to set hasSearched to true
    fireEvent.change(searchInput, { target: { value: "test query" } });
    
    // Wait for search to complete
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    // Now focus the input - should show results
    fireEvent.focus(searchInput);
    
    // Should show results container
    expect(screen.getByTestId("search-results-container")).toBeInTheDocument();
  });

  it("should close dropdown when clicking outside", async () => {
    // Mock search results
    mockUnifiedContext.youtube.searchResults = [
      {
        id: { videoId: "123" },
        snippet: {
          title: "Test Video",
          thumbnails: { default: { url: "test.jpg" } },
        },
      },
    ];

    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");
    
    // Perform a search to open dropdown
    fireEvent.change(searchInput, { target: { value: "test query" } });
    
    await waitFor(() => {
      expect(screen.getByTestId("search-results-container")).toBeInTheDocument();
    });

    // Click outside the search component
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByTestId("search-results-container")).not.toBeInTheDocument();
    });
  });

  it("should close dropdown when pressing escape key", async () => {
    // Mock search results
    mockUnifiedContext.youtube.searchResults = [
      {
        id: { videoId: "123" },
        snippet: {
          title: "Test Video",
          thumbnails: { default: { url: "test.jpg" } },
        },
      },
    ];

    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");
    
    // Perform a search to open dropdown
    fireEvent.change(searchInput, { target: { value: "test query" } });
    
    await waitFor(() => {
      expect(screen.getByTestId("search-results-container")).toBeInTheDocument();
    });

    // Press escape key
    fireEvent.keyDown(document, { key: "Escape" });
    
    await waitFor(() => {
      expect(screen.queryByTestId("search-results-container")).not.toBeInTheDocument();
    });
  });

  it("should not reopen dropdown after closing until new search", async () => {
    // Mock search results
    mockUnifiedContext.youtube.searchResults = [
      {
        id: { videoId: "123" },
        snippet: {
          title: "Test Video",
          thumbnails: { default: { url: "test.jpg" } },
        },
      },
    ];

    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");
    
    // Perform a search to open dropdown
    fireEvent.change(searchInput, { target: { value: "test query" } });
    
    await waitFor(() => {
      expect(screen.getByTestId("search-results-container")).toBeInTheDocument();
    });

    // Close dropdown by clicking outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByTestId("search-results-container")).not.toBeInTheDocument();
    });

    // Try to focus input again - should not reopen
    fireEvent.focus(searchInput);
    
    // Should still be closed
    expect(screen.queryByTestId("search-results-container")).not.toBeInTheDocument();
  });

  it("should clear previous results before new search", async () => {
    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");
    
    // First search
    fireEvent.change(searchInput, { target: { value: "first query" } });
    
    await waitFor(() => {
      expect(mockUnifiedContext.youtube.setSearchResults).toHaveBeenCalledWith([]);
      expect(mockUnifiedContext.spotify.setSearchResults).toHaveBeenCalledWith([]);
    });

    // Second search
    fireEvent.change(searchInput, { target: { value: "second query" } });
    
    await waitFor(() => {
      // Should clear results again before new search
      expect(mockUnifiedContext.youtube.setSearchResults).toHaveBeenCalledTimes(2);
      expect(mockUnifiedContext.spotify.setSearchResults).toHaveBeenCalledTimes(2);
    });
  });
});
