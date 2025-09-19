import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UnifiedSearchRefactored from "../UnifiedSearchRefactored";
import { useUnifiedContext } from "@/app/context/UnifiedContext";

// Mock the UnifiedContext
jest.mock("@/app/context/UnifiedContext");
const mockUseUnifiedContext = useUnifiedContext as jest.MockedFunction<
  typeof useUnifiedContext
>;

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
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [ref, callback]);
  }),
}));

describe("Search Dropdown Closing - Comprehensive Tests", () => {
  const mockOnSearch = jest.fn();
  const mockOnLoadMore = jest.fn();
  const mockSetSearchResults = jest.fn();

  const mockUnifiedContext = {
    youtube: {
      searchResults: [],
      setSearchResults: mockSetSearchResults,
      setNextPageToken: jest.fn(),
      setCurrentSearchTerm: jest.fn(),
    },
    spotify: {
      searchResults: [],
      setSearchResults: mockSetSearchResults,
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
    // Clear console logs
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should clear search input on outside click", async () => {
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
      expect(
        screen.getByTestId("search-results-container")
      ).toBeInTheDocument();
    });

    // Verify input has value
    expect(searchInput).toHaveValue("test query");

    // Click outside the search component
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByTestId("search-results-container")
      ).not.toBeInTheDocument();
    });

    // Verify input is cleared
    expect(searchInput).toHaveValue("");
  });

  it("should clear search results on outside click", async () => {
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
      expect(
        screen.getByTestId("search-results-container")
      ).toBeInTheDocument();
    });

    // Click outside the search component
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByTestId("search-results-container")
      ).not.toBeInTheDocument();
    });

    // Verify search results are cleared
    expect(mockSetSearchResults).toHaveBeenCalledWith([]);
  });

  it("should reset hasSearched state on outside click", async () => {
    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Perform a search
    fireEvent.change(searchInput, { target: { value: "test query" } });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    // Click outside
    fireEvent.mouseDown(document.body);

    // Focus input - should not open dropdown since hasSearched is reset
    fireEvent.focus(searchInput);

    // Should not show results container
    expect(
      screen.queryByTestId("search-results-container")
    ).not.toBeInTheDocument();
  });

  it("should clear pending search timeout on outside click", async () => {
    const mockClearTimeout = jest.spyOn(global, "clearTimeout");

    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Start typing (this would set a timeout)
    fireEvent.change(searchInput, { target: { value: "test" } });

    // Click outside before timeout completes
    fireEvent.mouseDown(document.body);

    // Should clear timeout
    expect(mockClearTimeout).toHaveBeenCalled();
  });

  it("should clear search input on escape key", async () => {
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
      expect(
        screen.getByTestId("search-results-container")
      ).toBeInTheDocument();
    });

    // Verify input has value
    expect(searchInput).toHaveValue("test query");

    // Press escape key
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByTestId("search-results-container")
      ).not.toBeInTheDocument();
    });

    // Verify input is cleared
    expect(searchInput).toHaveValue("");
  });

  it("should clear search results on escape key", async () => {
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
      expect(
        screen.getByTestId("search-results-container")
      ).toBeInTheDocument();
    });

    // Press escape key
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByTestId("search-results-container")
      ).not.toBeInTheDocument();
    });

    // Verify search results are cleared
    expect(mockSetSearchResults).toHaveBeenCalledWith([]);
  });

  it("should reset hasSearched state on escape key", async () => {
    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Perform a search
    fireEvent.change(searchInput, { target: { value: "test query" } });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    // Press escape
    fireEvent.keyDown(document, { key: "Escape" });

    // Focus input - should not open dropdown since hasSearched is reset
    fireEvent.focus(searchInput);

    // Should not show results container
    expect(
      screen.queryByTestId("search-results-container")
    ).not.toBeInTheDocument();
  });

  it("should clear pending search timeout on escape key", async () => {
    const mockClearTimeout = jest.spyOn(global, "clearTimeout");

    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Start typing (this would set a timeout)
    fireEvent.change(searchInput, { target: { value: "test" } });

    // Press escape before timeout completes
    fireEvent.keyDown(document, { key: "Escape" });

    // Should clear timeout
    expect(mockClearTimeout).toHaveBeenCalled();
  });

  it("should not reopen dropdown after clearing until new search", async () => {
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
      expect(
        screen.getByTestId("search-results-container")
      ).toBeInTheDocument();
    });

    // Clear by clicking outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByTestId("search-results-container")
      ).not.toBeInTheDocument();
    });

    // Try to focus input again - should not reopen
    fireEvent.focus(searchInput);

    // Should still be closed
    expect(
      screen.queryByTestId("search-results-container")
    ).not.toBeInTheDocument();

    // Only reopen when new search is performed
    fireEvent.change(searchInput, { target: { value: "new query" } });

    await waitFor(() => {
      expect(
        screen.getByTestId("search-results-container")
      ).toBeInTheDocument();
    });
  });

  it("should have defensive checks in focus handler", async () => {
    render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Focus empty input - should not reopen
    fireEvent.focus(searchInput);

    // Should not show results container
    expect(
      screen.queryByTestId("search-results-container")
    ).not.toBeInTheDocument();

    // Verify console log for not reopening
    expect(console.log).toHaveBeenCalledWith(
      "🔍 Search dropdown: Focus - not reopening",
      expect.objectContaining({
        hasSearched: false,
        hasQuery: false,
        hasResults: false,
      })
    );
  });

  it("should only reopen if query.trim() && hasSearched && combinedResults.length > 0", async () => {
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

    // Perform a search to set hasSearched and results
    fireEvent.change(searchInput, { target: { value: "test query" } });

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    });

    // Clear input but keep results
    fireEvent.change(searchInput, { target: { value: "" } });

    // Focus - should not reopen because query is empty
    fireEvent.focus(searchInput);

    // Should not show results container
    expect(
      screen.queryByTestId("search-results-container")
    ).not.toBeInTheDocument();

    // Verify console log for not reopening
    expect(console.log).toHaveBeenCalledWith(
      "🔍 Search dropdown: Focus - not reopening",
      expect.objectContaining({
        hasSearched: true,
        hasQuery: false,
        hasResults: true,
      })
    );
  });

  it("should provide comprehensive console logging for debugging", async () => {
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

    // Perform a search
    fireEvent.change(searchInput, { target: { value: "test query" } });

    await waitFor(() => {
      expect(
        screen.getByTestId("search-results-container")
      ).toBeInTheDocument();
    });

    // Click outside - should log clearing
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(
        screen.queryByTestId("search-results-container")
      ).not.toBeInTheDocument();
    });

    // Verify console log for outside click
    expect(console.log).toHaveBeenCalledWith(
      "🔍 Search dropdown: Outside click - clearing all state"
    );

    // Focus empty input - should log not reopening
    fireEvent.focus(searchInput);

    // Verify console log for not reopening
    expect(console.log).toHaveBeenCalledWith(
      "🔍 Search dropdown: Focus - not reopening",
      expect.objectContaining({
        hasSearched: false,
        hasQuery: false,
        hasResults: false,
      })
    );
  });

  it("should work across all pages with search component", () => {
    // Test that the clearing behavior works regardless of where the search component is used
    const { rerender } = render(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoadingMore={false}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Perform search
    fireEvent.change(searchInput, { target: { value: "test" } });

    // Clear with escape
    fireEvent.keyDown(document, { key: "Escape" });

    // Verify clearing works
    expect(searchInput).toHaveValue("");
    expect(mockSetSearchResults).toHaveBeenCalledWith([]);

    // Rerender with different props (simulating different page)
    rerender(
      <UnifiedSearchRefactored
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoadingMore={true}
      />
    );

    // Clearing should still work
    fireEvent.change(searchInput, { target: { value: "new test" } });
    fireEvent.keyDown(document, { key: "Escape" });

    expect(searchInput).toHaveValue("");
    expect(mockSetSearchResults).toHaveBeenCalledWith([]);
  });
});
