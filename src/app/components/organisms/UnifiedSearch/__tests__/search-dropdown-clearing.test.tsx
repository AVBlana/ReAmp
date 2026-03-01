import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UnifiedSearch from "../index";
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

describe("Search Dropdown Clearing Behavior", () => {
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

  it("should clear search input and close dropdown when clicking outside", async () => {
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
      <UnifiedSearch
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

  it("should clear search input and close dropdown when pressing escape", async () => {
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
      <UnifiedSearch
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
      <UnifiedSearch
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

  it("should reset hasSearched state when clearing", async () => {
    render(
      <UnifiedSearch
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

    // Clear by pressing escape
    fireEvent.keyDown(document, { key: "Escape" });

    // Focus input - should not open dropdown since hasSearched is reset
    fireEvent.focus(searchInput);

    // Should not show results container
    expect(
      screen.queryByTestId("search-results-container")
    ).not.toBeInTheDocument();
  });
});
