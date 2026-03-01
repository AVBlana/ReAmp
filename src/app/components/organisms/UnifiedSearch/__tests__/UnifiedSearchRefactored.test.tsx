import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import UnifiedSearch from "../index";
import { useUnifiedContext } from "@/app/context/UnifiedContext";
import { ServiceType } from "@/app/types/playerTypes";

// Mock the context
jest.mock("@/app/context/UnifiedContext");
const mockUseUnifiedContext = useUnifiedContext as jest.MockedFunction<
  typeof useUnifiedContext
>;

// Mock the useOutsideClick hook
jest.mock("@/app/hooks", () => ({
  useOutsideClick: jest.fn(),
}));

// Mock SearchResultsContainer
jest.mock("@/app/components/SearchResultsContainer", () => {
  return function MockSearchResultsContainer({ children, isOpen }: any) {
    return isOpen ? <div data-testid="search-results">{children}</div> : null;
  };
});

// Mock SearchResultItem
jest.mock("@/app/components/molecules/SearchResultItem", () => {
  return function MockSearchResultItem({ title, onAddToPlaylist }: any) {
    return (
      <div data-testid="search-result-item" onClick={onAddToPlaylist}>
        {title}
      </div>
    );
  };
});

describe("UnifiedSearch", () => {
  const mockOnSearch = jest.fn();
  const mockOnLoadMore = jest.fn();
  const mockYoutube = {
    searchResults: [],
    setSearchResults: jest.fn(),
    nextPageToken: null,
  };
  const mockSpotify = {
    searchResults: [],
    setSearchResults: jest.fn(),
  };
  const mockUnified = {
    playlist: [],
    addToPlaylist: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUnifiedContext.mockReturnValue({
      youtube: mockYoutube,
      spotify: mockSpotify,
      unified: mockUnified,
    } as any);
  });

  it("renders search input correctly", () => {
    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");
    expect(searchInput).toBeInTheDocument();
  });

  it("clears search input and results on outside click", async () => {
    const mockUseOutsideClick = require("@/app/hooks").useOutsideClick;
    let outsideClickHandler: () => void;

    mockUseOutsideClick.mockImplementation((ref: any, handler: () => void) => {
      outsideClickHandler = handler;
    });

    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Type in search input
    fireEvent.change(searchInput, { target: { value: "test query" } });
    expect(searchInput).toHaveValue("test query");

    // Simulate outside click
    outsideClickHandler!();

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
      expect(mockYoutube.setSearchResults).toHaveBeenCalledWith([]);
      expect(mockSpotify.setSearchResults).toHaveBeenCalledWith([]);
    });
  });

  it("clears search input and results on escape key", async () => {
    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Type in search input
    fireEvent.change(searchInput, { target: { value: "test query" } });
    expect(searchInput).toHaveValue("test query");

    // Press escape key
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
      expect(mockYoutube.setSearchResults).toHaveBeenCalledWith([]);
      expect(mockSpotify.setSearchResults).toHaveBeenCalledWith([]);
    });
  });

  it("debounces search input and calls onSearch", async () => {
    jest.useFakeTimers();

    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Type in search input
    fireEvent.change(searchInput, { target: { value: "test query" } });

    // Fast-forward time to trigger debounced search
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(
        "test query",
        ServiceType.Youtube
      );
      expect(mockOnSearch).toHaveBeenCalledWith(
        "test query",
        ServiceType.Spotify
      );
    });

    jest.useRealTimers();
  });

  it("does not reopen dropdown on focus if no valid search exists", () => {
    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Focus the input without any search query
    fireEvent.focus(searchInput);

    // Should not show search results
    expect(screen.queryByTestId("search-results")).not.toBeInTheDocument();
  });

  it("shows search results when available", () => {
    const mockYoutubeResults = [
      {
        id: { videoId: "1" },
        snippet: {
          title: "YouTube Video",
          channelTitle: "Channel",
          thumbnails: { medium: { url: "thumb.jpg" } },
        },
      },
    ];

    const mockSpotifyResults = [
      {
        id: "2",
        title: "Spotify Song",
        artist: { name: "Artist" },
        artwork: { medium: { url: "artwork.jpg" } },
        type: ServiceType.Spotify,
      },
    ];

    mockYoutube.searchResults = mockYoutubeResults;
    mockSpotify.searchResults = mockSpotifyResults;

    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    // Should show search results container
    expect(screen.getByTestId("search-results")).toBeInTheDocument();
    expect(screen.getByText("YouTube Video")).toBeInTheDocument();
    expect(screen.getByText("Spotify Song")).toBeInTheDocument();
  });

  it("handles add to playlist correctly", () => {
    const mockYoutubeResults = [
      {
        id: { videoId: "1" },
        snippet: {
          title: "YouTube Video",
          channelTitle: "Channel",
          thumbnails: { medium: { url: "thumb.jpg" } },
        },
      },
    ];

    mockYoutube.searchResults = mockYoutubeResults;

    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchResultItem = screen.getByText("YouTube Video");
    fireEvent.click(searchResultItem);

    expect(mockUnified.addToPlaylist).toHaveBeenCalledWith({
      id: "1",
      type: ServiceType.Youtube,
      data: mockYoutubeResults[0],
    });
  });

  it("cancels pending search timeout on outside click", () => {
    const mockUseOutsideClick = require("@/app/hooks").useOutsideClick;
    let outsideClickHandler: () => void;

    mockUseOutsideClick.mockImplementation((ref: any, handler: () => void) => {
      outsideClickHandler = handler;
    });

    jest.useFakeTimers();

    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Type in search input to start debounced search
    fireEvent.change(searchInput, { target: { value: "test query" } });

    // Simulate outside click before timeout completes
    outsideClickHandler!();

    // Fast-forward time - search should not be called
    jest.advanceTimersByTime(500);

    expect(mockOnSearch).not.toHaveBeenCalled();

    jest.useRealTimers();
  });

  it("cancels pending search timeout on escape key", () => {
    jest.useFakeTimers();

    render(
      <UnifiedSearch
        onSearch={mockOnSearch}
        onLoadMore={mockOnLoadMore}
      />
    );

    const searchInput = screen.getByPlaceholderText("Search for songs...");

    // Type in search input to start debounced search
    fireEvent.change(searchInput, { target: { value: "test query" } });

    // Press escape key before timeout completes
    fireEvent.keyDown(document, { key: "Escape" });

    // Fast-forward time - search should not be called
    jest.advanceTimersByTime(500);

    expect(mockOnSearch).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});
