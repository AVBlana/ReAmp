import { ReactNode } from "react";

interface SearchResultsContainerProps {
  isOpen: boolean;
  children: ReactNode;
  theme: {
    primary: string;
    secondary: string;
  };
  className?: string;
}

export default function SearchResultsContainer({
  isOpen,
  children,
  theme,
  className = "",
}: SearchResultsContainerProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-[${theme.primary}]/20 rounded-lg shadow-lg max-h-[400px] overflow-y-auto ${className} [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#1A1A1A] [&::-webkit-scrollbar-thumb]:bg-[${theme.primary}]/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[${theme.primary}]/40 [&::-webkit-scrollbar-thumb]:transition-colors [&::-webkit-scrollbar-thumb]:duration-300`}
    >
      <div className="relative">
        {/* Top shadow */}
        <div className="sticky top-0 h-8 bg-gradient-to-b from-[#1A1A1A] to-transparent pointer-events-none z-10" />

        {/* Results */}
        <div className="py-2">{children}</div>

        {/* Bottom shadow */}
        <div className="sticky bottom-0 h-8 bg-gradient-to-t from-[#1A1A1A] to-transparent pointer-events-none z-10" />
      </div>
    </div>
  );
}
