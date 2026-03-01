import { ReactNode } from "react";

// Import atomic design components
import Button from "@/app/components/atoms/Button";

interface SearchResultsContainerProps {
  isOpen: boolean;
  children: ReactNode;
  theme: {
    primary: string;
    secondary: string;
  };
  className?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  /** Prevent mousedown from bubbling so click-outside doesn't close when clicking inside */
  onMouseDown?: (e: React.MouseEvent) => void;
}

export default function SearchResultsContainer({
  isOpen,
  children,
  theme,
  className = "",
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  onMouseDown,
}: SearchResultsContainerProps) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="search-results-container"
      className={`absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-[${theme.primary}]/20 rounded-lg shadow-lg max-h-[400px] overflow-y-auto ${className} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1A1A1A] [&::-webkit-scrollbar-thumb]:bg-[${theme.primary}]/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[${theme.primary}]/40 [&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300`}
      onMouseDown={onMouseDown}
    >
      <div className="relative">
        {/* Top shadow */}
        <div className="sticky top-0 h-8 bg-gradient-to-b from-[#1A1A1A] to-transparent pointer-events-none z-10" />

        {/* Results */}
        <div className="py-2">
          {children}

          {/* Load More Button */}
          {hasMore && (
            <div className="px-4 py-2 flex justify-center">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore || !onLoadMore}
                variant="watermelon"
                size="sm"
                className="bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/20"
                loading={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>

        {/* Bottom shadow */}
        <div className="sticky bottom-0 h-8 bg-gradient-to-t from-[#1A1A1A] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
